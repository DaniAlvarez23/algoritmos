/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Compass,
  Users,
  Award,
  BookOpen,
  User,
  GraduationCap,
  Sparkles,
  Info,
  LogOut,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { ClassStudent, BlockCodeAST, ChatMessage, Mission } from "./types";
import { INITIAL_MISSIONS, INITIAL_STUDENTS, LEVELS_TRACK } from "./data";
import LoginScreen from "./components/LoginScreen";
import StudentApp from "./components/StudentApp";
import TeacherDashboard from "./components/TeacherDashboard";

import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, onSnapshot } from "firebase/firestore";
import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from "./firebase";

export default function App() {
  // Login / Session credentials state
  const [isLoggedIn, setIsLoggedIn] = useState(true); // default logged in to show immediately
  const [userRole, setUserRole] = useState<"student" | "teacher">("student");
  const [userName, setUserName] = useState("Mateo Jiménez");

  // Firebase state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingFirebase, setIsLoadingFirebase] = useState(false);

  // Global shared synchronization state
  const [coins, setCoins] = useState(125);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [levelsTrack, setLevelsTrack] = useState(LEVELS_TRACK);
  const [studentAST, setStudentAST] = useState<BlockCodeAST>({
    blocks: [
      { id: "b1", type: "al_empezar", next_block_id: "b2" },
      { id: "b2", type: "poner_olla", next_block_id: "b3" }
    ]
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: "api", message: "¡Hola Mateo! Recuerda que para cocinar la changua debes calentar la leche primero.", timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { sender: "student", message: "No sé cómo hacer para que no esté crudo el huevo.", timestamp: new Date(Date.now() - 13 * 60 * 1000).toISOString() },
    { sender: "api", message: "¡No te preocupes, parce! Piensa en qué orden harías esto en la estufa real. ¿Primero echas el calado o pones a hervir la leche con sal?", timestamp: new Date(Date.now() - 11 * 60 * 1000).toISOString() }
  ]);

  // AI Orchestrator custom mode ("Heuristic" | "Technical" | "Automatic" | "Silent")
  const [coachMode, setCoachMode] = useState<"Heuristic" | "Technical" | "Automatic" | "Silent">("Heuristic");

  // Roster lists for teachers
  const [studentsRoster, setStudentsRoster] = useState<ClassStudent[]>(INITIAL_STUDENTS);

  // Stateful wrappers to update local React state and fire write operations to Firestore in the background
  const setCoinsAndPersist = (val: React.SetStateAction<number>) => {
    setCoins(prev => {
      const next = typeof val === "function" ? (val as Function)(prev) : val;
      if (auth.currentUser) {
        const path = `users/${auth.currentUser.uid}`;
        updateDoc(doc(db, "users", auth.currentUser.uid), {
          coins: next,
          updatedAt: new Date().toISOString()
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
      }
      return next;
    });
  };

  const setMissionsAndPersist = (val: React.SetStateAction<Mission[]>) => {
    setMissions(prev => {
      const next = typeof val === "function" ? (val as Function)(prev) : val;
      if (auth.currentUser) {
        const path = `users/${auth.currentUser.uid}`;
        updateDoc(doc(db, "users", auth.currentUser.uid), {
          missionsState: JSON.stringify(next),
          updatedAt: new Date().toISOString()
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
      }
      return next;
    });
  };

  const setLevelsTrackAndPersist = (val: React.SetStateAction<any[]>) => {
    setLevelsTrack(prev => {
      const next = typeof val === "function" ? (val as Function)(prev) : val;
      if (auth.currentUser) {
        const path = `users/${auth.currentUser.uid}`;
        updateDoc(doc(db, "users", auth.currentUser.uid), {
          levelsState: JSON.stringify(next),
          updatedAt: new Date().toISOString()
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
      }
      return next;
    });
  };

  const setStudentASTAndPersist = (val: React.SetStateAction<BlockCodeAST>) => {
    setStudentAST(prev => {
      const next = typeof val === "function" ? (val as Function)(prev) : val;
      if (auth.currentUser) {
        const path = `users/${auth.currentUser.uid}`;
        updateDoc(doc(db, "users", auth.currentUser.uid), {
          studentASTState: JSON.stringify(next),
          updatedAt: new Date().toISOString()
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
      }
      return next;
    });
  };

  const setChatHistoryAndPersist = (val: React.SetStateAction<ChatMessage[]>) => {
    setChatHistory(prev => {
      const next = typeof val === "function" ? (val as Function)(prev) : val;
      if (auth.currentUser) {
        const path = `users/${auth.currentUser.uid}`;
        // Enviar último mensaje como un documento para auditabilidad detallada
        const lastMsg = next[next.length - 1];
        if (lastMsg) {
          const chatDocRef = doc(collection(db, "users", auth.currentUser.uid, "chat"));
          setDoc(chatDocRef, {
            sender: lastMsg.sender,
            message: lastMsg.message,
            timestamp: lastMsg.timestamp
          }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `${path}/chat`));
        }

        updateDoc(doc(db, "users", auth.currentUser.uid), {
          chatHistoryState: JSON.stringify(next),
          updatedAt: new Date().toISOString()
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
      }
      return next;
    });
  };

  // Monitor Firebase Auth events
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsLoadingFirebase(true);
        const path = `users/${user.uid}`;
        try {
          const userDocRef = doc(db, "users", user.uid);
          
          let userDocSnap;
          try {
            userDocSnap = await getDoc(userDocRef);
          } catch (getErr) {
            handleFirestoreError(getErr, OperationType.GET, path);
          }

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserRole(data.role || "student");
            setUserName(data.name || user.displayName || "Explorador Google");
            if (data.coins !== undefined) setCoins(data.coins);
            if (data.levelsState) {
              try { setLevelsTrack(JSON.parse(data.levelsState)); } catch (e) {}
            }
            if (data.missionsState) {
              try { setMissions(JSON.parse(data.missionsState)); } catch (e) {}
            }
            if (data.studentASTState) {
              try { setStudentAST(JSON.parse(data.studentASTState)); } catch (e) {}
            }
            if (data.chatHistoryState) {
              try { setChatHistory(JSON.parse(data.chatHistoryState)); } catch (e) {}
            }
          } else {
            // First-time signup with Google: Create Firestore central record profile
            const pendingRole = (localStorage.getItem("pending_google_role") as "student" | "teacher") || "student";
            const newDoc = {
              uid: user.uid,
              name: user.displayName || "Explorador Google",
              email: user.email || "",
              avatar: "🤠",
              coins: 125,
              streak: 3,
              xp: 240,
              role: pendingRole,
              levelsState: JSON.stringify(LEVELS_TRACK),
              missionsState: JSON.stringify(INITIAL_MISSIONS),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            try {
              await setDoc(userDocRef, newDoc);
            } catch (setErr) {
              handleFirestoreError(setErr, OperationType.CREATE, path);
            }

            setUserRole(pendingRole);
            setUserName(newDoc.name);
            setCoins(newDoc.coins);
            setLevelsTrack(LEVELS_TRACK);
            setMissions(INITIAL_MISSIONS);
          }
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Firestore authentication profile initialization error:", error);
        } finally {
          setIsLoadingFirebase(false);
        }
      } else {
        // Not authenticated - preserve student/teacher offline demo state without forcing Google Login
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync real registered students from Firestore for the TeacherDashboard in real-time
  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: ClassStudent[] = [];
      snapshot.forEach((snap) => {
        const d = snap.data();
        if (d.role === "student") {
          let lvlTrack = LEVELS_TRACK;
          let chatH = chatHistory;
          let codeA = studentAST;

          try {
            if (d.levelsState) lvlTrack = JSON.parse(d.levelsState);
          } catch(e) {}
          try {
            if (d.chatHistoryState) chatH = JSON.parse(d.chatHistoryState);
          } catch(e) {}
          try {
            if (d.studentASTState) codeA = JSON.parse(d.studentASTState);
          } catch(e) {}

          const l2 = lvlTrack.find(l => l.id === 2);
          const levelingProgress = l2 ? l2.progress : 60;

          loaded.push({
            id: snap.id,
            name: d.name || "Estudiante",
            grade: "Grado 6°",
            avatar: d.avatar || "🤠",
            readingSpeed: 92,
            levelingProgress: levelingProgress,
            status: levelingProgress >= 100 ? "Excelente" : "En Progreso",
            subject: "Pensamiento Algorítmico",
            recentTopic: "Variables y Bucles",
            chatHistory: chatH,
            codeAST: codeA,
            errorsCount: d.streak > 0 ? 0 : 2
          });
        }
      });

      if (loaded.length > 0) {
        setStudentsRoster(prev => {
          const mapper = new Map();
          INITIAL_STUDENTS.forEach(student => mapper.set(student.name, student));
          loaded.forEach(student => mapper.set(student.name, student));
          return Array.from(mapper.values());
        });
      }
    }, (err) => {
      console.error("Error snapping users list:", err);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // Compute active roster to keep Mateo Jiménez or Google user in sync with student panel updates
  const activeRoster = studentsRoster.map(student => {
    const isCurrentActive = student.name === userName || (student.id === firebaseUser?.uid);
    if (isCurrentActive) {
      const level2 = levelsTrack.find(l => l.id === 2);
      const levelingProgress = level2 ? level2.progress : 60;
      return {
        ...student,
        coins: coins,
        levelingProgress: levelingProgress,
        codeAST: studentAST,
        chatHistory: chatHistory,
        inactiveMinutes: 0,
        status: (levelingProgress >= 100 ? "Excelente" : "En Progreso") as any
      };
    }
    return student;
  });

  // Manual role toggle for exploring both student & teacher consoles instantly!
  const [activeFrame, setActiveFrame] = useState<"student" | "teacher" | "about">("student");

  // Traditional manual Login (Demostrativo Offline)
  const handleLogin = (role: "student" | "teacher", name: string) => {
    setUserRole(role);
    setUserName(name);
    setIsLoggedIn(true);
    setActiveFrame(role === "student" ? "student" : "teacher");
  };

  const handleGoogleLogin = async (role: "student" | "teacher") => {
    setIsLoadingFirebase(true);
    try {
      localStorage.setItem("pending_google_role", role);
      await loginWithGoogle();
      setActiveFrame(role === "student" ? "student" : "teacher");
    } catch (e) {
      console.error("Failed to login with Google:", e);
      throw e;
    } finally {
      setIsLoadingFirebase(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logoutUser();
    } catch(e) {}
    setIsLoggedIn(false);
    setFirebaseUser(null);
  };

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        isLoadingFirebase={isLoadingFirebase}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FF] font-sans flex flex-col selection:bg-[#FB92A1] selection:text-[#400012] text-[#1A1B20]">
      
      {/* Prime branding top header bar */}
      <header className="bg-white border-b-3 border-[#6E5A52] sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-[0px_4px_0px_0px_#6E5A52]">
        
        {/* Brand logo block */}
        <div className="flex items-center gap-3">
          <div className="bg-[#FB92A1] border-2 border-[#6E5A52] w-10 h-10 rounded-xl shadow-[2px_2px_0px_0px_#6E5A52] flex items-center justify-center text-xl font-bold font-serif animate-bounce">
            ⚡
          </div>
          <div>
            <h1 className="font-extrabold text-base md:text-lg font-serif leading-none text-[#1A1B20] tracking-tight">
              Aprendizaje Vibrante
            </h1>
            <p className="text-[10px] text-gray-500 font-mono font-bold leading-none mt-1 uppercase tracking-wider">
              Plataforma Heurística de Programación
            </p>
          </div>
        </div>

        {/* Global panel frame toggle handles for parents, pedagogues or AI sandboxing */}
        <div className="flex items-center gap-2 bg-[#EDEDF4] border-2 border-[#6E5A52] rounded-full p-1 max-w-[400px]">
          <button
            onClick={() => setActiveFrame("student")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all duration-150 cursor-pointer ${
              activeFrame === "student"
                ? "bg-[#984351] text-white border border-black shadow-[1px_1px_0px_0px_black]"
                : "text-gray-600 hover:text-black"
            }`}
          >
             Estudiante
          </button>
          
          <button
            onClick={() => setActiveFrame("teacher")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all duration-150 cursor-pointer ${
              activeFrame === "teacher"
                ? "bg-[#984351] text-white border border-black shadow-[1px_1px_0px_0px_black]"
                : "text-gray-600 hover:text-black"
            }`}
          >
             Docente
          </button>

          <button
            onClick={() => setActiveFrame("about")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all duration-150 cursor-pointer ${
              activeFrame === "about"
                ? "bg-[#E2E2E9] text-[#1A1B20] border border-black shadow-[1px_1px_0px_0px_black]"
                : "text-gray-600 hover:text-black"
            }`}
          >
             Acerca De
          </button>
        </div>

        {/* Session details tag */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-extrabold font-mono text-[#984351]">
              Sesión: {userName}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-mono text-gray-400 font-extrabold">
              Rol: {userRole === "student" ? "Alumno Grado 6" : "Profesor"}
            </span>
          </div>

          <button
            onClick={handleLogoutClick}
            className="p-2 border-2 border-[#6E5A52] rounded-xl hover:bg-gray-50 active:translate-y-0.5 shadow-[2px_2px_0px_0px_#6E5A52] bg-white text-[#984351] cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>

      </header>

      {/* Floating Orchestration HUD banner notifying of active live telemetry updates */}
      <div className="bg-[#1A1B20] text-white text-center py-2 px-4 text-xs font-mono font-bold flex items-center justify-center gap-3 border-b-2 border-black z-10 select-none">
        <Sliders size={14} className="text-[#FB92A1]" />
        <span>Orquestador pedagógico: {coachMode === "Heuristic" ? "Heurístico (Analogías de Changua)" : coachMode}</span>
        <div className="h-4 w-[1px] bg-gray-700 hidden sm:block" />
        <span className="hidden sm:inline text-gray-400 font-normal">Cambia el modo en el Panel de Docente para ver la reacción de API el Robot</span>
      </div>

      {/* Main Sandbox Workspace Area */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFrame}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {activeFrame === "student" && (
              <StudentApp
                coins={coins}
                setCoins={setCoinsAndPersist}
                missions={missions}
                setMissions={setMissionsAndPersist}
                levelsTrack={levelsTrack}
                setLevelsTrack={setLevelsTrackAndPersist}
                studentAST={studentAST}
                setStudentAST={setStudentASTAndPersist}
                chatHistory={chatHistory}
                setChatHistory={setChatHistoryAndPersist}
                coachMode={coachMode}
              />
            )}

            {activeFrame === "teacher" && (
              <TeacherDashboard
                coachMode={coachMode}
                setCoachMode={setCoachMode}
                students={activeRoster}
                setStudents={setStudentsRoster}
                chatHistory={chatHistory}
                setChatHistory={setChatHistoryAndPersist}
              />
            )}

            {activeFrame === "about" && (
              <div className="p-8 max-w-3xl mx-auto space-y-6">
                <div className="bg-white border-3 border-[#6E5A52] rounded-[24px] p-6 shadow-[4px_4px_0px_0px_#6E5A52] space-y-4">
                  <div className="border-b-2 border-gray-100 pb-2">
                    <span className="bg-[#F5DACF] text-[#984351] border border-[#6E5A52] font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      Especificación de Proyecto
                    </span>
                    <h2 className="text-2xl font-black font-serif text-[#1A1B20] pt-2">
                      Acerca del Entorno de Aprendizaje
                    </h2>
                  </div>

                  <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                    Un ambiente inteligente y reactivo de aprendizaje diseñado para estudiantes de grado 6°. Mediante la secuenciación de bloques en un editor gamificado, los alumnos logran asimilar los principios básicos del pensamiento algorítmico preparando platos tradicionales como la <strong>Changua Bogotana</strong> o lanzando el tejo boyacense.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-[#EDEDF4] p-4 border border-[#6E5A52] rounded-xl space-y-1">
                      <h4 className="font-extrabold text-[#984351] text-xs font-mono uppercase">🤖 Robot Inteligente API</h4>
                      <p className="text-[11px] text-gray-600 leading-normal">
                        Mascota y copiloto robótico que cuenta con sombrero vueltiao y se expresa con sutiles modismos boyacenses y bogotanos para generar empatía y cercanía didáctica.
                      </p>
                    </div>

                    <div className="bg-[#EDEDF4] p-4 border border-[#6E5A52] rounded-xl space-y-1">
                      <h4 className="font-extrabold text-[#984351] text-xs font-mono uppercase">🎯 Andamiaje Heurístico</h4>
                      <p className="text-[11px] text-gray-600 leading-normal">
                        Estructurado según cuatro perfiles de orquestación (Heurístico, Técnico, Automático, Silencioso) regulables por el docente para mitigar niveles de frustración crítica en tiempo real.
                      </p>
                    </div>
                  </div>

                  <div className="border-t-2 border-dashed border-[#EDEDF4] pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-500 font-mono gap-4">
                    <span>Desarrollado para el fomento STEM de Pensamiento Algorítmico</span>
                    <span className="bg-[#FB92A1] text-black px-2 py-0.5 rounded border border-black font-bold">
                      VER 2.4.0
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

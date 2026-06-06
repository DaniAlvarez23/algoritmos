/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Brain,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Send,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ClassStudent, BlockCodeAST, ChatMessage } from "../types";
import { INITIAL_STUDENTS } from "../data";

interface TeacherDashboardProps {
  coachMode: "Heuristic" | "Technical" | "Automatic" | "Silent";
  setCoachMode: (mode: "Heuristic" | "Technical" | "Automatic" | "Silent") => void;
  students: ClassStudent[];
  setStudents: React.Dispatch<React.SetStateAction<ClassStudent[]>>;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function TeacherDashboard({
  coachMode,
  setCoachMode,
  students,
  setStudents,
  chatHistory,
  setChatHistory
}: TeacherDashboardProps) {
  // Search and Advanced Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState<"todos" | "6A" | "6B">("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | "Atención" | "Excelente" | "Óptimo" | "En Progreso">("todos");

  // Selected student for block code AST & chat history inspection modal
  const [selectedStudent, setSelectedStudent] = useState<ClassStudent | null>(null);

  // Intervention sending state
  const [customHint, setCustomHint] = useState("");
  const [interventionSuccess, setInterventionSuccess] = useState(false);

  // Filter students based on search metrics and selector dropdowns
  const filteredStudents = students.map(student => {
    // If it's Mateo, we sync his chat logs and codeAST from App state!
    if (student.name === "Mateo Jiménez") {
      return {
        ...student,
        chatHistory: chatHistory
      };
    }
    return student;
  }).filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.grade.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = 
      gradeFilter === "todos" ? true :
      gradeFilter === "6A" ? student.grade.includes("6A") :
      gradeFilter === "6B" ? student.grade.includes("6B") : true;

    const matchesStatus = 
      statusFilter === "todos" ? true :
      student.status === statusFilter;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  // Handle setting a custom teacher intervention hint
  const sendTeacherIntervention = (studentId: string) => {
    if (!customHint.trim()) return;

    // Append to global chat log if it's Mateo, or the student object
    const teacherMsg: ChatMessage = {
      sender: "api",
      message: `🔔 Mensaje del Docente: "${customHint.trim()}"`,
      timestamp: new Date().toISOString()
    };

    if (selectedStudent?.name === "Mateo Jiménez") {
      setChatHistory(prev => [...prev, teacherMsg]);
    }

    setStudents(prev => prev.map(st => {
      if (st.id === studentId) {
        return {
          ...st,
          chatHistory: [...st.chatHistory, teacherMsg],
          status: "Óptimo", // Upgrades status since teacher guided them
          errorsCount: 0 // clears successive errors
        };
      }
      return st;
    }));

    setInterventionSuccess(true);
    setCustomHint("");
    setTimeout(() => {
      setInterventionSuccess(false);
      // Close modal
      setSelectedStudent(null);
    }, 2000);
  };

  // Immediate intervention action from top warning banner
  const quickInterveneMateo = () => {
    const mateo = students.find(s => s.name === "Mateo Jiménez");
    if (mateo) {
      setSelectedStudent(mateo);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FF] p-6 font-sans text-[#1A1B20]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top welcome band & header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-[#6E5A52] pb-6">
          <div>
            <span className="bg-[#F5DACF] text-[#984351] border-2 border-[#6E5A52] font-mono text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Control Cockpit • Parent & Teacher Panel
            </span>
            <h1 className="font-extrabold text-3xl font-serif text-[#1A1B20] tracking-tight mt-2 flex items-center gap-2">
              Panel del Docente 👩‍🏫
            </h1>
            <p className="text-sm text-[#544244] mt-1">
              Monitorea niveles de frustración, orquesta el bot pedagógico e interviene en tiempo real.
            </p>
          </div>

          {/* Connected state badge */}
          <div className="flex items-center gap-2 bg-green-50 border-2 border-green-600 rounded-full px-4 py-2 self-start sm:self-auto shadow-[2px_2px_0px_0px_green]">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-green-900 font-mono uppercase">● Telemetría Conectada</span>
          </div>
        </div>

        {/* 3 Summary metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white border-3 border-[#6E5A52] rounded-[24px] p-6 shadow-[4px_4px_0px_0px_#6E5A52] flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-gray-500 font-bold uppercase">Rendimiento Promedio</span>
              <h3 className="text-3xl font-black font-serif text-[#1A1B20]">8.4 / 10</h3>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-0.5">
                <TrendingUp size={12} />
                +2.4% esta semana
              </p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-700 border-2 border-green-600 font-bold text-xl">
              📈
            </div>
          </div>

          <div className="bg-white border-3 border-[#6E5A52] rounded-[24px] p-6 shadow-[4px_4px_0px_0px_#6E5A52] flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-gray-500 font-bold uppercase">Estudiantes Activos</span>
              <h3 className="text-3xl font-black font-serif text-[#1A1B20]">24 / 26</h3>
              <p className="text-xs text-slate-500 font-semibold">92% de asistencia hoy</p>
            </div>
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 border-2 border-[#6E5A52]">
              <Users size={24} />
            </div>
          </div>

          {/* Crucial Alerts indicator */}
          <div className="bg-white border-3 border-[#984351] rounded-[24px] p-6 shadow-[4px_4px_0px_0px_#984351] flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-red-600 font-bold uppercase">Incidentes Críticos</span>
              <h3 className="text-3xl font-black font-serif text-red-700">1 Alerta</h3>
              <p className="text-xs text-red-600 font-semibold">Inactividad + Errores AST</p>
            </div>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-700 border-2 border-red-600 animate-bounce">
              <AlertTriangle size={24} />
            </div>
          </div>

        </div>

        {/* Warning banner detailing Mateo's frustration state */}
        <div className="bg-red-50 border-3 border-red-600 rounded-[24px] p-6 shadow-[4px_4px_0px_0px_#984351] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-4 items-start">
            <span className="text-4xl p-2 bg-red-200 border-2 border-red-700 rounded-xl">🤠</span>
            <div className="space-y-1 max-w-xl">
              <span className="bg-red-200 text-red-800 border border-red-500 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono">
                Alerta de Frustración Crítica
              </span>
              <h4 className="text-lg font-extrabold text-[#1A1B20] mt-1">Mateo Jiménez (Grado 6A)</h4>
              <p className="text-xs text-red-950 font-semibold leading-relaxed">
                El estudiante lleva <strong>15 minutos inactivo</strong> y acumula <strong>5 intentos fallidos consecutivos</strong> de ordenamiento secuencial en el &quot;Reto de la Changua&quot;. Su AST muestra huevos adicionados antes del hervor. Se sugiere enviar asistencia.
              </p>
            </div>
          </div>

          <button
            onClick={quickInterveneMateo}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white border-2 border-black rounded-full font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer self-stretch md:self-auto text-center justify-center"
          >
            <Send size={12} />
            <span>Intervenir Ahora</span>
          </button>
        </div>

        {/* AI Agent Orchestration mode card selection */}
        <div className="bg-white border-3 border-[#6E5A52] rounded-[24px] p-6 shadow-[4px_4px_0px_0px_#6E5A52] space-y-4">
          <div className="border-b-2 border-[#EDEDF4] pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-base text-[#1A1B20] font-serif">⚙️ Nivel de Orquestación del API Agent</h4>
              <p className="text-xs text-gray-500 font-semibold">Toma control sobre la didáctica y tipo de feedback del Robot Inteligente.</p>
            </div>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase self-start">
              Activo: {coachMode}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              {
                id: "Heuristic",
                title: "Heurístico 🧑‍🍳",
                description: "Provee analogías tradicionales (platillos, deportes) y guía con andamiaje de andamios.",
                color: "bg-[#FB92A1]/20 border-[#FB92A1]/60"
              },
              {
                id: "Technical",
                title: "Técnico 💻",
                description: "Feedback enfocado en flujo lógico, AST secuencial, mensajes de error técnicos.",
                color: "bg-[#F5DACF]/40 border-[#F5DACF]"
              },
              {
                id: "Automatic",
                title: "Automático ⚙️",
                description: "El modelo determina el feedback analizando la curva de inactividad de Mateo.",
                color: "bg-indigo-50 border-indigo-200"
              },
              {
                id: "Silent",
                title: "Silencioso 🤫",
                description: "Apaga los comentarios interactivos del Robot. Solo compila errores.",
                color: "bg-gray-50 border-gray-200"
              }
            ].map(mode => (
              <div
                key={mode.id}
                onClick={() => setCoachMode(mode.id as any)}
                className={`p-4 border-2 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5 ${
                  coachMode === mode.id
                    ? `${mode.color} border-3 border-black shadow-[3px_3px_0px_0px_#6E5A52] -translate-y-0.5 ring-2 ring-[#984351]/20`
                    : "bg-white hover:bg-gray-50 border-[#D7D7DE]"
                }`}
              >
                <h5 className="font-extrabold text-sm text-[#1A1B20]">{mode.title}</h5>
                <p className="text-[10px] text-gray-600 leading-normal font-semibold mt-1">{mode.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Student data list grid table */}
        <div className="bg-white border-3 border-[#6E5A52] rounded-[24px] p-6 shadow-[6px_6px_0px_0px_#6E5A52] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#EDEDF4] pb-4">
            <div>
              <h4 className="font-extrabold text-base font-serif text-[#6E5A52]">Estado General de la Clase</h4>
              <p className="text-xs text-gray-500 font-semibold">Búsqueda rápida y filtros avanzados de categorización.</p>
            </div>

            {/* Quick search & filter inputs */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {/* Search bar input */}
              <div className="relative flex-1 sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Búsqueda rápida de alumno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-[#EDEDF4] border-2 border-[#6E5A52] rounded-xl focus:outline-none focus:border-[#984351]"
                />
              </div>

              {/* Grade select filter */}
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value as any)}
                className="bg-white border-2 border-[#6E5A52] rounded-xl text-xs font-bold px-3 py-2 cursor-pointer"
              >
                <option value="todos">Todos los Grados</option>
                <option value="6A">Grado 6A</option>
                <option value="6B">Grado 6B</option>
              </select>

              {/* Status select filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border-2 border-[#6E5A52] rounded-xl text-xs font-bold px-3 py-2 cursor-pointer"
              >
                <option value="todos">Cualquier Estado</option>
                <option value="Excelente">Excelente ⭐</option>
                <option value="Óptimo">Óptimo</option>
                <option value="En Progreso">En Progreso</option>
                <option value="Atención">Atención</option>
              </select>
            </div>
          </div>

          {/* Student roster lists layout */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#6E5A52] text-[10px] font-mono text-gray-500 uppercase font-bold bg-[#F3F3FA]">
                  <th className="p-3">Alumno</th>
                  <th className="p-3">Grado</th>
                  <th className="p-3">Lectura Veloz</th>
                  <th className="p-3">Progreso de Código</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-xs text-[#1A1B20]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-400">
                      Ningún alumno coincide con los filtros de búsqueda rápida.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr
                      key={st.id}
                      className={`hover:bg-[#F9F9FF] transition-all ${
                        st.status === "Atención" ? "bg-red-50/50" : ""
                      }`}
                    >
                      <td className="p-3 flex items-center gap-3">
                        <span className="text-2xl p-1 bg-gray-100 border border-[#6E5A52] rounded-full">{st.avatar}</span>
                        <div>
                          <p className="font-extrabold text-[#1A1B20] text-sm">{st.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono leading-none">{st.subject}</p>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#725E56]">{st.grade}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold">{st.readingSpeed}%</span>
                          <div className="w-16 h-2 bg-gray-100 border border-[#6E5A52] rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${st.readingSpeed}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold">{st.levelingProgress}%</span>
                          <div className="w-16 h-2 bg-gray-100 border border-[#6E5A52] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${st.levelingProgress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] uppercase font-bold border ${
                          st.status === "Excelente" ? "bg-green-100 text-green-800 border-green-300" :
                          st.status === "Óptimo" ? "bg-blue-100 text-blue-800 border-blue-300" :
                          st.status === "En Progreso" ? "bg-amber-100 text-amber-800 border-amber-300" :
                          "bg-red-100 text-red-800 border-red-500 font-extrabold animate-pulse"
                        }`}>
                          {st.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedStudent(st)}
                          className="px-3 py-1.5 bg-white border-2 border-[#6E5A52] hover:bg-gray-50 text-xs font-bold rounded-lg shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-1 cursor-pointer ml-auto active:translate-y-0.5 active:shadow-none transition-all"
                        >
                          <Eye size={12} />
                          <span>Inspeccionar</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL: Detailed telemetry inspector (AST & Chat overriding) */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-[#6E5A52] rounded-[24px] shadow-[8px_8px_0px_0px_#000] max-w-2xl w-full p-6 relative"
            >
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-lg text-gray-500 border border-transparent hover:border-gray-300 cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Modal user header */}
              <div className="flex items-center gap-4 border-b-2 border-gray-100 pb-4 mb-4">
                <span className="text-4xl p-2 bg-gray-50 border-2 border-black rounded-xl">
                  {selectedStudent.avatar}
                </span>
                <div>
                  <h3 className="text-xl font-extrabold font-serif text-[#1A1B20]">{selectedStudent.name}</h3>
                  <p className="text-xs text-gray-500 font-mono font-bold uppercase">{selectedStudent.grade} • {selectedStudent.subject}</p>
                </div>
              </div>

              {/* Layout columns: Left Block AST representation, Right: API conversation log */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Code AST Panel */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-xs text-[#6E5A52] uppercase font-mono tracking-wider">
                    🌳 Árbol AST del Workspace
                  </h5>
                  <div className="bg-[#F3F3FA] border-2 border-[#6E5A52] rounded-xl p-4 min-h-[180px] max-h-[240px] overflow-y-auto font-mono text-[10px] text-[#1A1B20] space-y-2">
                    {selectedStudent.codeAST.blocks.length === 0 ? (
                      <p className="text-gray-400 italic">No hay bloques ensamblados aún.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-[9px] text-[#984351] font-bold border-b border-gray-300 pb-1">
                          JSON AST Schema:
                        </div>
                        {selectedStudent.codeAST.blocks.map((block, index) => (
                          <div key={block.id} className="bg-white border border-[#D7D7DE] p-2 rounded-lg relative pl-4">
                            <span className="absolute left-1 top-2 text-[8px] text-gray-400">#</span>
                            <div className="flex justify-between items-center text-green-700 font-bold">
                              <span>type: &quot;{block.type}&quot;</span>
                            </div>
                            <div className="text-gray-500 mt-1">
                              <p>id: &quot;{block.id}&quot;</p>
                              <p>next_block_id: {block.next_block_id ? `"${block.next_block_id}"` : `null`}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Chat inspector pane */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-xs text-[#6E5A52] uppercase font-mono tracking-wider">
                    💬 Conversación con API Robot
                  </h5>
                  <div className="bg-[#EDEDF4] border-2 border-[#6E5A52] rounded-xl p-3 min-h-[180px] max-h-[240px] overflow-y-auto space-y-2 text-[11px] font-semibold leading-relaxed">
                    {selectedStudent.chatHistory.length === 0 ? (
                      <p className="text-gray-400 italic text-center py-8">No hay interacciones registradas.</p>
                    ) : (
                      selectedStudent.chatHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl border ${
                            item.sender === "student"
                              ? "bg-white border-gray-200 self-end ml-4 text-right"
                              : "bg-[#F5DACF] border-[#6E5A52] mr-4 text-left"
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-wider font-mono text-[#725E56] font-bold block mb-0.5">
                            {item.sender === "student" ? "Mateo (Estudiante)" : "API (Robot)"}
                          </span>
                          <p>{item.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Intervention form at bottom */}
              <div className="mt-6 pt-4 border-t-2 border-dashed border-[#EDEDF4] space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6E5A52] font-mono block">
                    Enviar Sugerencia o Pista Directa:
                  </label>
                  <p className="text-[10px] text-gray-500 font-semibold">
                    Esto aparecerá en el chat del alumno inmediatamente como un consejo de andamiaje.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customHint}
                    onChange={(e) => setCustomHint(e.target.value)}
                    placeholder="E.g., ¡Hola Mateo! Recuerda primero hervir la leche con sal y cilantro antes de echar los huevos..."
                    disabled={interventionSuccess}
                    className="flex-1 bg-white border-2 border-[#6E5A52] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#984351]"
                  />
                  <button
                    onClick={() => sendTeacherIntervention(selectedStudent.id)}
                    disabled={!customHint.trim() || interventionSuccess}
                    className="px-4 py-2 bg-[#FB92A1] hover:bg-[#F27E8F] text-[#400012] border-2 border-[#6E5A52] rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-1 active:translate-y-0.5 active:shadow-none cursor-pointer disabled:opacity-50"
                  >
                    <span>ENVIAR</span>
                  </button>
                </div>

                <AnimatePresence>
                  {interventionSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-green-100 text-green-800 border border-green-300 p-2.5 rounded-xl text-center text-xs font-bold"
                    >
                      ✔ ¡Pista enviada con éxito! El estado del estudiante se actualizó a Óptimo.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Play,
  Clock,
  Flame,
  Trophy,
  Coins,
  Search,
  SlidersHorizontal,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Award,
  BookOpen,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { INITIAL_BLOCKS, INITIAL_MISSIONS, ACHIEVEMENTS } from "../data";
import { CodeBlock, Mission, Achievement, BlockCodeAST, ChatMessage } from "../types";

interface StudentAppProps {
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  missions: Mission[];
  setMissions: React.Dispatch<React.SetStateAction<Mission[]>>;
  levelsTrack: any[];
  setLevelsTrack: React.Dispatch<React.SetStateAction<any[]>>;
  studentAST: BlockCodeAST;
  setStudentAST: React.Dispatch<React.SetStateAction<BlockCodeAST>>;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  coachMode: "Heuristic" | "Technical" | "Automatic" | "Silent";
}

export default function StudentApp({
  coins,
  setCoins,
  missions,
  setMissions,
  levelsTrack,
  setLevelsTrack,
  studentAST,
  setStudentAST,
  chatHistory,
  setChatHistory,
  coachMode
}: StudentAppProps) {
  // Navigation tabs inside student interface
  const [activeTab, setActiveTab] = useState<"misiones" | "lecciones" | "editor" | "simulacion" | "perfil">("misiones");
  
  // Selected level/challenge in the editor workspace (default is 2, since Level 2 "Chef de Bucles" is active)
  const [selectedLevelId, setSelectedLevelId] = useState<number>(2);

  // Search & filter states for misiones
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCriteria, setFilterCriteria] = useState<"todas" | "pendientes" | "completadas" | "altas_monedas">("todas");

  // Code workspace states
  const [workspaceBlocks, setWorkspaceBlocks] = useState<CodeBlock[]>(() => {
    // Map initial state if loaded
    return studentAST.blocks.map(b => {
      const match = INITIAL_BLOCKS.find(ib => ib.type === b.type);
      return match ? { ...match, id: b.id } : { id: b.id, type: b.type, label: b.type, color: "bg-gray-200" };
    });
  });

  // Sound and music simulation settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Simulation status states
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(-1);
  const [simProgress, setSimProgress] = useState(0);
  const [simStepsHistory, setSimStepsHistory] = useState<{ step: string; status: "success" | "pending" | "error" }[]>([]);
  const [simMessage, setSimMessage] = useState("¡Hola, parce! Prepara tu código en el Editor y haz clic en EJECUTAR para ver la magia.");
  const [simConfetti, setSimConfetti] = useState(false);

  // Helper mapping Level ID to its block pack dynamically
  const getBlocksForLevel = (levelId: number): CodeBlock[] => {
    switch (levelId) {
      case 2:
        return [
          { id: "al_empezar", type: "al_empezar", label: "Al empezar 🏁", color: "bg-[#FB92A1] text-[#261812]" },
          { id: "verter_harina", type: "verter_harina", label: "Verter harina de maíz en tazón 🥣", color: "bg-[#FFF9E6] text-[#78350F]" },
          { id: "agregar_agua_sal", type: "agregar_agua_sal", label: "Agregar agua templada con sal 🧂", color: "bg-[#E6F0FF] text-[#1E3A8A]" },
          { id: "repetir_amasar", type: "repetir_amasar", label: "Repetir amasar 3 veces 🔄", color: "bg-[#FFF5D5] text-[#92400E]" },
          { id: "asar_arepa", type: "asar_arepa", label: "Asar arepa en plancha caliente 🫓", color: "bg-[#FFEBF5] text-[#831843]" }
        ];
      case 3:
        return [
          { id: "al_empezar", type: "al_empezar", label: "Al empezar 🏁", color: "bg-[#FB92A1] text-[#261812]" },
          { id: "apuntar_cancha", type: "apuntar_cancha", label: "Apuntar hacia la greda de la cancha 🎯", color: "bg-[#E6FFF5] text-[#065F46]" },
          { id: "lanzar_tejo", type: "lanzar_tejo", label: "Lanzar tejo de metal con fuerza 💪", color: "bg-[#F1F5F9] text-[#1E293B]" },
          { id: "si_golpea_mecha", type: "si_golpea_mecha", label: "Si el tejo golpea la mecha 💥", color: "bg-[#FFF0F0] text-[#991B1B]" },
          { id: "celebrar_monona", type: "celebrar_monona", label: "Celebrar moñona y saludar 🎉", color: "bg-[#F3E8FF] text-[#5B21B6]" }
        ];
      case 1:
      default:
        return [
          { id: "al_empezar", type: "al_empezar", label: "Al empezar 🏁", color: "bg-[#FB92A1] text-[#261812]" },
          { id: "poner_olla", type: "poner_olla", label: "Poner olla con leche en estufa 🍲", color: "bg-[#F5DACF] text-[#400012]" },
          { id: "esperar_hervir", type: "esperar_hervir", label: "Esperar a que hierva ⏳", color: "bg-[#E0BFBE] text-[#291616]" },
          { id: "agregar_huevos", type: "agregar_huevos", label: "Agregar huevos 🥚", color: "bg-[#FFD9DD] text-[#400012]" },
          { id: "agregar_calado", type: "agregar_calado", label: "Agregar calado (pan) 🍞", color: "bg-[#DBC1B7] text-[#261812]" },
          { id: "picar_cilantro", type: "picar_cilantro", label: "Picar cilantro fresco 🌿", color: "bg-[#E2E2E9] text-[#1A1B20]" }
        ];
    }
  };

  // Sync workspace blocks to studentAST for teacher visibility
  useEffect(() => {
    setStudentAST({
      blocks: workspaceBlocks.map((b, idx) => ({
        id: b.id,
        type: b.type,
        next_block_id: idx < workspaceBlocks.length - 1 ? workspaceBlocks[idx + 1].id : null
      }))
    });
  }, [workspaceBlocks]);

  // Handle adding a block to the workspace canvas
  const addBlockToWorkspace = (block: CodeBlock) => {
    const newBlockWithUniqueId = {
      ...block,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setWorkspaceBlocks([...workspaceBlocks, newBlockWithUniqueId]);
    
    // Robot reactive tip on adding blocks
    if (coachMode !== "Silent") {
      let message = "";
      if (block.type === "al_empezar") {
        message = "¡Ese es el bloque de inicio, mi llave! Excelente. Ahora añade qué ingrediente o acción sigue.";
      } else if (block.type === "poner_olla") {
        message = "¡Sisas! Poner la olla es clave. En Colombia, el agua, la leche y la sal van calientes.";
      } else if (block.type === "esperar_hervir") {
        message = "Bien pensado. Hay que esperar el hervor. ¡No querrás echar huevo a la leche helada!";
      } else {
        message = `Añadiste: "${block.label.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "").trim()}". ¡Vamos coordinando esa receta, parce!`;
      }
      addChatMessage("api", message);
    }
  };

  // Helper to append chat messages
  const addChatMessage = (sender: "student" | "api", message: string) => {
    const newMsg: ChatMessage = {
      sender,
      message,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, newMsg]);
  };

  // Remove block from workspace canvas
  const removeBlock = (id: string) => {
    setWorkspaceBlocks(workspaceBlocks.filter(b => b.id !== id));
  };

  // Clear all workspace blocks
  const clearWorkspace = () => {
    setWorkspaceBlocks([]);
    if (coachMode !== "Silent") {
      addChatMessage("api", "Limpiaste el lienzo. ¡No hay problema! Volvamos a empezar con calma, paso a paso.");
    }
  };

  // Filtered available missions based on search query and advanced selector
  const filteredMissions = missions.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterCriteria === "todas" ? true :
      filterCriteria === "pendientes" ? !m.completed :
      filterCriteria === "completadas" ? m.completed :
      filterCriteria === "altas_monedas" ? m.coinsReward >= 30 : true;

    return matchesSearch && matchesFilter;
  });

  // Action: Launch a mission or start simulator
  const handleMissionAction = (mission: Mission) => {
    if (mission.completed) return;
    
    if (mission.id === "m1") {
      // "Preparar el tinto" - load pre-set block challenge
      setSelectedLevelId(1);
      setWorkspaceBlocks([]);
      setActiveTab("editor");
      if (coachMode !== "Silent") {
        addChatMessage("api", "¡Listo para preparar el tinto o la changua! Arma tu secuencia a continuación.");
      }
    } else if (mission.id === "m2") {
      // "Lanzar Tejo boyacense"
      // sets active challenge to Tejo (Level 3)
      setSelectedLevelId(3);
      setWorkspaceBlocks([]);
      setActiveTab("editor");
      if (coachMode !== "Silent") {
        addChatMessage("api", "¡Epa! Prepárate para el campeonato de tejo profesional. Usa el condicional 'Si el tejo golpea la mecha' 💥 para estallar de emoción.");
      }
    }
  };

  // Validate student Block sequence and run Simulation!
  const runCodeSimulation = async () => {
    if (workspaceBlocks.length === 0) {
      setSimMessage("🚫 ¡Oye, parce! Tu lienzo de código está vacío. Ve al Editor y añade algunos bloques para cocinar.");
      setActiveTab("simulacion");
      return;
    }

    setActiveTab("simulacion");
    setSimulationRunning(true);
    setSimProgress(0);
    setSimStepIndex(-1);
    setSimConfetti(false);

    // Initialise simulation steps based on current level challenge
    let stepsTrack = [];
    if (selectedLevelId === 2) {
      stepsTrack = [
        { step: "Echar harina en el tazón 🥣", status: "pending" as const },
        { step: "Adicionar agua con sal 🧂", status: "pending" as const },
        { step: "Hacer amasar en bucle 🔄", status: "pending" as const },
        { step: "Poner en plancha caliente 🫓", status: "pending" as const }
      ];
    } else if (selectedLevelId === 3) {
      stepsTrack = [
        { step: "Fijar postura en greda 🎯", status: "pending" as const },
        { step: "Impulsar el tejo de plomo 💪", status: "pending" as const },
        { step: "Evaluar si golpeó la mecha 💥", status: "pending" as const },
        { step: "Estallar pólvora y festejar 🎉", status: "pending" as const }
      ];
    } else {
      stepsTrack = [
        { step: "Calentar la olla con leche 🥛", status: "pending" as const },
        { step: "Hervir al punto perfecto ⏳", status: "pending" as const },
        { step: "Cocinar los huevos suaves 🥚", status: "pending" as const },
        { step: "Adicionar el calado crujiente 🍞", status: "pending" as const }
      ];
    }
    setSimStepsHistory(stepsTrack);

    // Call the server endpoint to evaluate if workspace is active, or use local sandbox with client fallback
    let isCorrect = false;
    let errorType: string | null = null;
    let explanation = "Ejecución correcta.";

    try {
      const response = await fetch("/api/gemini/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: workspaceBlocks,
          coachMode: coachMode,
          levelId: selectedLevelId
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reqData = await response.json();
      isCorrect = reqData.scaffolding_evaluation?.is_correct_execution ?? false;
      errorType = reqData.scaffolding_evaluation?.error_type_detected ?? null;
      explanation = reqData.student_visible_response ?? "Ejecución correcta.";
    } catch (err) {
      console.warn("API evaluation failed, using high-fidelity local fallback:", err);
      const seq = workspaceBlocks.map((b: any) => b.type);
      const sequenceStr = seq.join(" -> ");
      isCorrect = true;
      errorType = null;

      if (seq.length === 0) {
        explanation = "¡Hola, parce! Tu lienzo de código está vacío. Recuerda iniciar con el bloque 🏁 'Al empezar' para que sepamos por dónde arrancar.";
        isCorrect = false;
        errorType = "lienzo_vacio";
      } else if (seq[0] !== "al_empezar") {
        explanation = "¡Caramba, mi llave! 🤠 Para que el robot sepa cuándo iniciar el proceso, debes arrancar con el bloque 'Al empezar' 🏁 en la posición #1. ¡Ajústalo y volvemos a intentar!";
        isCorrect = false;
        errorType = "sin_inicio";
      } else {
        if (selectedLevelId === 2) {
          if (!seq.includes("verter_harina")) {
            explanation = "¡Caray, parce! Pusiste a amasar pero... ¡se te olvidó echar la harina de maíz en el tazón! 🥣 ¿De dónde va a salir la arepa? Añade ese bloque.";
            isCorrect = false;
            errorType = "sin_harina";
          } else if (seq.includes("agregar_agua_sal") && seq.indexOf("agregar_agua_sal") < seq.indexOf("verter_harina")) {
            explanation = "¡Ojo, mi llave! Primero echa la harina en el tazón 🥣, y luego le añades el agua con sal para que no se te haga un pegote en la mesa.";
            isCorrect = false;
            errorType = "agua_antes_harina";
          } else if (!seq.includes("repetir_amasar")) {
            explanation = "¡Qué calavera! 💀 Pusiste la masa en la plancha directa... ¡pero no la amasaste! 🫓 Esa arepa te va a quedar dura como una teja boyacense. Agrégale el bucle de amasar.";
            isCorrect = false;
            errorType = "sin_amasar";
          } else if (seq.includes("asar_arepa") && seq.indexOf("asar_arepa") < seq.indexOf("repetir_amasar")) {
            explanation = "¡Ave María, parce! Pusiste a asar la arepa en la plancha antes de amasarla. ¡Primero amasa bien 3 veces para que tenga suavidad y quesito!";
            isCorrect = false;
            errorType = "asar_antes_amasar";
          } else {
            explanation = "¡Qué masa tan suave, mi llave! 🎉 Lograste amasar la arepa boyacense perfecta con queso y mantequilla. ¡Pura delicia de Tibasosa terminada!";
          }
        } else if (selectedLevelId === 3) {
          if (!seq.includes("apuntar_cancha")) {
            explanation = "¡Ojo al charco, mi llave! 🎯 Vas a lanzar el tejo sin apuntar a la cancha. ¡Puedes tumbarle el tinto al compadre! Primero apunta bien en la greda.";
            isCorrect = false;
            errorType = "sin_apuntar";
          } else if (seq.includes("lanzar_tejo") && seq.indexOf("lanzar_tejo") < seq.indexOf("apuntar_cancha")) {
            explanation = "¡Qué berraquera! Lanzaste el tejo antes de apuntar. ¡Eso es tiro perdido, parce! Primero apunta y luego lanza con fuerza.";
            isCorrect = false;
            errorType = "lanzar_antes_apuntar";
          } else if (!seq.includes("si_golpea_mecha")) {
            explanation = "¡Casi, parce! Lanzaste el tejo pero... ¿y si golpea la mecha con pólvora? 💥 Necesitas el bloque condicional 'Si el tejo golpea la mecha' para evaluar si hiciste Moñona.";
            isCorrect = false;
            errorType = "sin_condicion_mecha";
          } else if (seq.includes("celebrar_monona") && seq.indexOf("celebrar_monona") < seq.indexOf("si_golpea_mecha")) {
            explanation = "¡Epa! Celebraste la moñona antes de comprobar si el tejo realmente golpeó la mecha. ¡Tranquilo, mi llave! Primero evalúa si hubo explosión.";
            isCorrect = false;
            errorType = "celebrar_antes_mecha";
          } else {
            explanation = "¡PUMMMM! 💥 ¡Hiciste Moñona, parce! Sonó la pólvora, estalló la mecha y toda la tribuna te aplaude con un buen tinto caliente. ¡Excelente algoritmo condicional!";
          }
        } else {
          if (!seq.includes("poner_olla")) {
            explanation = "¡Qué calavera! 💀 Pusiste a cocinar cosas pero... ¡se te olvidó poner la olla en la estufa! 🍲 ¿Dónde vamos a hervir la leche, parce? Añade ese bloque después del inicio.";
            isCorrect = false;
            errorType = "sin_olla";
          } else if (seq.includes("esperar_hervir") && seq.indexOf("esperar_hervir") < seq.indexOf("poner_olla")) {
            explanation = "¡Ave María! 🍳 Esperaste que hirviera la leche antes de colocar la olla en la estufa. ¡Ojo con el flujo de las cosas! Primero pones la olla con leche, luego esperas que caliente.";
            isCorrect = false;
            errorType = "orden_hervir_fallido";
          } else if (seq.includes("agregar_huevos") && !seq.includes("esperar_hervir")) {
            explanation = "¡Ojo al charco! 🥚 Agregaste los huevos pero la leche no ha hervido. En Colombia, si echas el huevo en leche fría se nos deshace y queda baboso. ¡Primero pon a hervir la leche con sal!";
            isCorrect = false;
            errorType = "huevos_sin_hervir";
          } else if (seq.includes("agregar_huevos") && seq.indexOf("agregar_huevos") < seq.indexOf("esperar_hervir")) {
            explanation = "¡Casi, mi llave! 🌿 Los huevos se echan justamente DESPUÉS de que la leche hierva con burbujas. Intenta mover el bloque 'Esperar a que hierva' ⏳ antes de 'Agregar huevos' 🥚.";
            isCorrect = false;
            errorType = "huevos_pre_hervir";
          } else if (!seq.includes("agregar_calado")) {
            explanation = "¡Delicioso aroma! Leche hervida y huevos cocidos... pero falta el toque crujiente. ¡Agrégale calado (pan boyacense) 🍞 a esa changua antes de servir!";
            isCorrect = false;
            errorType = "falta_calado";
          } else {
            explanation = "¡Ay caray, qué delicia! 🎉 Lograste armar la secuencia perfecta de la Changua Bogotana: Inicio 🏁 -> Olla en estufa 🍲 -> Hervir ⏳ -> Huevos 🥚 -> Calado 🍞. ¡Eres todo un maestro programador y chef!";
          }
        }
      }

      if (coachMode === "Technical") {
        explanation = `[AST ANALYSER] ${isCorrect ? "COMPILATION SUCCESSFUL" : "FLOW COMPILATION ERROR"}: code=${errorType || "OK"}. sequence="${sequenceStr}". Sequence integrity checks passed=${isCorrect}. Advice: ensure FIFO logic.`;
      } else if (coachMode === "Silent") {
        explanation = isCorrect ? "Ejecución correcta." : `Error: ${errorType}.`;
      }
    }

    try {

      // Let's animate steps
      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep < 4) {
          setSimStepIndex(currentStep);
          
          // Determine if this step fails due to compilation block order
          let isStepError = false;
          if (!isCorrect) {
            if (selectedLevelId === 2) {
              if (errorType === "sin_harina" && currentStep === 0) isStepError = true;
              else if (errorType === "agua_antes_harina" && currentStep === 1) isStepError = true;
              else if (errorType === "sin_amasar" && currentStep === 2) isStepError = true;
              else if (errorType === "asar_antes_amasar" && currentStep === 3) isStepError = true;
              else if (currentStep === 0 && !["sin_harina", "agua_antes_harina", "sin_amasar", "asar_antes_amasar"].includes(errorType || "")) {
                isStepError = true;
              }
            } else if (selectedLevelId === 3) {
              if (errorType === "sin_apuntar" && currentStep === 0) isStepError = true;
              else if (errorType === "lanzar_antes_apuntar" && currentStep === 1) isStepError = true;
              else if (errorType === "sin_condicion_mecha" && currentStep === 2) isStepError = true;
              else if (errorType === "celebrar_antes_mecha" && currentStep === 3) isStepError = true;
              else if (currentStep === 0 && !["sin_apuntar", "lanzar_antes_apuntar", "sin_condicion_mecha", "celebrar_antes_mecha"].includes(errorType || "")) {
                isStepError = true;
              }
            } else {
              if (errorType === "sin_olla" && currentStep === 0) isStepError = true;
              else if (errorType === "orden_hervir_fallido" && currentStep === 1) isStepError = true;
              else if (errorType === "huevos_sin_hervir" && currentStep === 2) isStepError = true;
              else if (errorType === "huevos_pre_hervir" && currentStep === 2) isStepError = true;
              else if (errorType === "falta_calado" && currentStep === 3) isStepError = true;
              else if (currentStep === 0 && !["sin_olla", "orden_hervir_fallido", "huevos_sin_hervir", "huevos_pre_hervir", "falta_calado"].includes(errorType || "")) {
                isStepError = true;
              }
            }
            // Fallback: failed instantly on step 0
            if ((errorType === "lienzo_vacio" || errorType === "sin_inicio") && currentStep === 0) {
              isStepError = true;
            }
          }

          if (isStepError) {
            setSimulationRunning(false);
            setSimStepsHistory(prev => prev.map((s, idx) => idx === currentStep ? { ...s, status: "error" as const } : s));
            clearInterval(interval);
            setSimMessage(`❌ ${explanation}`);
            addChatMessage("api", explanation);
            return;
          }

          // Step matches okay!
          setSimStepsHistory(prev => prev.map((s, idx) => idx === currentStep ? { ...s, status: "success" as const } : s));
          setSimProgress((prev) => Math.min(prev + 25, 100));

          let stepText = "";
          if (selectedLevelId === 2) {
            switch (currentStep) {
              case 0: stepText = "Añadiste la harina de maíz pre-cocida amarilla al tazón."; break;
              case 1: stepText = "Vertiste el agua tibia salada con pedacitos de mantequilla derritiéndose."; break;
              case 2: stepText = "Amasaste vigorosamente la masa con el ciclo bucle. Quedó súper suave."; break;
              case 3: stepText = "Colocaste las arepas en el budare caliente para asarlas."; break;
            }
          } else if (selectedLevelId === 3) {
            switch (currentStep) {
              case 0: stepText = "Te paraste firme fijando la greda húmeda en el fondo."; break;
              case 1: stepText = "Lanzaste el tejo metálico pesado girando en el aire."; break;
              case 2: stepText = "El tejo va cayendo justo en el centro de la cancha."; break;
              case 3: stepText = "¡Toca evaluar la mecha!"; break;
            }
          } else {
            switch (currentStep) {
              case 0: stepText = "La estufa está encendida. La olla con leche, sal y agua se calienta lentamente."; break;
              case 1: stepText = "¡Esa leche ya está hirviendo, subiendo con espuma! Ahora toca el huevo."; break;
              case 2: stepText = "Echamos los huevos despacito. Esperando 3 minutos a que cuajen perfectamente."; break;
              case 3: stepText = "Agregando el calado boyacense de pan crujiente y espolvoreando cilantro verde sabroso."; break;
            }
          }
          setSimMessage(`🔥 Acción: ${stepText}`);
          currentStep++;
        } else {
          // Success! Complete
          setSimulationRunning(false);
          setSimProgress(100);
          setSimConfetti(true);
          setSimMessage(`🎉 ¡ÉXITO! ${explanation}`);
          clearInterval(interval);

          // Add AI evaluation to live chat histories
          addChatMessage("api", explanation);

          // Calculate coin reward
          const reward = selectedLevelId === 2 ? 50 : selectedLevelId === 3 ? 75 : 35;
          setCoins(prev => prev + reward);

          // Update stateful levelsTrack progress & status
          setLevelsTrack(prev => {
            return prev.map(level => {
              if (level.id === selectedLevelId) {
                return { ...level, progress: 100, status: "completado" as const };
              }
              // Unlock Level 3 once Level 2 is completed!
              if (selectedLevelId === 2 && level.id === 3) {
                return { ...level, status: "activo" as const, progress: 0 };
              }
              return level;
            });
          });

          // Synchronize successfully resolved level with the daily student missions
          setMissions(prev => {
            return prev.map(mission => {
              if (selectedLevelId === 1 && mission.id === "m1") {
                return { ...mission, completed: true, progress: 1 };
              }
              if (selectedLevelId === 3 && mission.id === "m2") {
                return { ...mission, completed: true, progress: 3 };
              }
              return mission;
            });
          });
        }
      }, 1500);

    } catch (err) {
      console.error("Simulation error querying API evaluation:", err);
      setSimulationRunning(false);
      setSimMessage("🚫 Ocurrió un error consultando al robot pedagógico virtual. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#F9F9FF] font-sans">
      {/* Search and filter bar at the top */}
      <div className="bg-[#F3F3FA] border-b-3 border-[#6E5A52] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-12 z-20 shadow-[0px_4px_0px_0px_#6E5A52]">
        <div className="flex items-center gap-2">
          <Award className="text-[#984351] animate-bounce" size={24} />
          <div>
            <h2 className="font-extrabold text-lg text-[#1A1B20] font-serif">Módulo del Estudiante</h2>
            <p className="text-[11px] text-[#725E56] font-mono uppercase font-bold">Mateo Jiménez • Grado 6A</p>
          </div>
        </div>

        {/* Instant Search Bar */}
        <div className="flex flex-1 max-w-lg w-full items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar misiones o niveles rápidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-white border-2 border-[#6E5A52] rounded-full focus:outline-none focus:border-[#984351]"
            />
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-1 bg-white border-2 border-[#6E5A52] rounded-full px-3 py-2">
            <SlidersHorizontal size={14} className="text-[#725E56]" />
            <select
              value={filterCriteria}
              onChange={(e) => setFilterCriteria(e.target.value as any)}
              className="text-xs font-bold bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="todas">Todos los Desafíos</option>
              <option value="pendientes">Por hacer</option>
              <option value="completadas">Ya ganados</option>
              <option value="altas_monedas">Coins {">"}= 30</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Frame container with internal navigation tabs */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Playful side block with global student stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[#F5DACF] border-3 border-[#6E5A52] rounded-[24px] p-5 shadow-[4px_4px_0px_0px_#6E5A52]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white border-3 border-[#6E5A52] text-3xl flex items-center justify-center mx-auto shadow-sm">
                🤠
              </div>
              <h3 className="font-extrabold font-serif mt-2 text-[#261812]">Mateo Jiménez</h3>
              <span className="bg-[#984351] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-black uppercase">
                Grado 6A
              </span>
            </div>

            {/* Micro stats table */}
            <div className="mt-4 space-y-2 font-semibold text-xs border-t-2 border-dashed border-[#6E5A52] pt-4">
              <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-[#6E5A52]">
                <span className="flex items-center gap-1">💸 Monedas:</span>
                <span className="bg-[#fcf3e6] px-2 py-0.5 rounded-lg border border-[#e0c3ab] font-bold text-[#984351] flex items-center gap-0.5">
                  <Coins size={12} className="text-amber-500 fill-amber-300" />
                  {coins}
                </span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-[#6E5A52]">
                <span className="flex items-center gap-1">🔥 Racha:</span>
                <span className="text-orange-600 font-bold flex items-center gap-0.5">
                  <Flame size={12} className="fill-orange-400" />
                  7 Días
                </span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-[#6E5A52]">
                <span className="flex items-center gap-1">🎮 Misiones:</span>
                <span>24 completadas</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-[#6E5A52]">
                <span className="flex items-center gap-1">👑 Clasificación:</span>
                <span className="text-indigo-700 font-extrabold font-mono">#12 Grado 6A</span>
              </div>
            </div>
            
            {/* Quick action button */}
            <button
              onClick={() => runCodeSimulation()}
              className="w-full mt-4 bg-[#FB92A1] hover:bg-[#F27E8F] text-[#400012] border-2 border-[#6E5A52] py-2 rounded-full font-bold text-xs shadow-[2px_2px_0px_0px_#6E5A52] flex items-center justify-center gap-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <Play size={12} className="fill-current" />
              <span>Simulación Rápida</span>
            </button>
          </div>

          {/* Quick robot helper speech widget */}
          <div className="bg-white border-3 border-[#6E5A52] rounded-[24px] p-4 shadow-[4px_4px_0px_0px_#6E5A52] text-xs relative">
            <div className="absolute -top-3 left-6 bg-[#984351] text-white border-2 border-black px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider font-mono">
              Robot Inteligente (API)
            </div>
            <p className="mt-2 text-gray-700 font-medium leading-relaxed italic">
              "Para programar, parce, piensa en secuencias lógicas. Como cuando te levantas: primero te vistes y luego sales de la casa, ¿sí o qué?"
            </p>
            <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-500 font-mono">
              <span>Modo actual:</span>
              <span className="bg-[#F5DACF] text-[#984351] font-bold px-1.5 py-0.5 rounded border border-[#6E5A52]">
                {coachMode}
              </span>
            </div>
          </div>
        </div>

        {/* Central main workspace area */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Main navigation badges inside Student App */}
          <div className="flex flex-wrap items-center gap-2 border-b-3 border-[#6E5A52] pb-3">
            {[
              { id: "misiones", label: "🎯 Misiones Diarias", color: "bg-[#FB92A1]" },
              { id: "lecciones", label: "🗺️ Ruta de Código", color: "bg-[#F5DACF]" },
              { id: "editor", label: "🧩 Editor de Bloques", color: "bg-[#ffd9dd]" },
              { id: "simulacion", label: "🍲 Simulación Cocina", color: "bg-[#DBC1B7]" },
              { id: "perfil", label: "🤠 Mi Hoja de Vida", color: "bg-[#E2E2E9]" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 border-2 border-[#6E5A52] ${
                  activeTab === tab.id
                    ? `${tab.color} text-[#1A1B20] shadow-[2px_2px_0px_0px_#6E5A52] -translate-y-0.5`
                    : "bg-white text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* TABS INNER VIEWS */}
              {activeTab === "misiones" && (
                <div className="space-y-6">
                  {/* Hero intro header frame */}
                  <div className="bg-white border-3 border-[#6E5A52] rounded-[24px] p-6 shadow-[4px_4px_0px_0px_#6E5A52] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Trophy size={140} />
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="w-36 h-36 bg-[#F5DACF] rounded-2xl border-2 border-black flex items-center justify-center p-2 shadow-inner">
                        {/* Simulation of Robot image */}
                        <div className="text-7xl">🤖</div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <h2 className="text-2xl font-extrabold font-serif text-[#1A1B20]">
                          ¡Hola, Programador!
                        </h2>
                        <p className="text-sm text-[#544244] leading-relaxed">
                          "API" el Robot está listo para ayudarte a conquistar tus retos y misiones de hoy. ¡Aprende jugando código, gana monedas y pídeme sugerencias en cualquier momento!
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <span className="bg-[#FB92A1] text-[#400012] border border-[#6E5A52] font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                            🔥 NUEVAS MISIONES EN: 14H 20M
                          </span>
                          <span className="bg-[#EDEDF4] text-[#1A1B20] border border-[#6E5A52] font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                            Doble de recompensa activado
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Available Quests list layout */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-extrabold font-serif text-[#6E5A52]">
                        Desafíos Disponibles ({filteredMissions.length})
                      </h3>
                      {filteredMissions.length === 0 && (
                        <button
                          onClick={() => { setSearchQuery(""); setFilterCriteria("todas"); }}
                          className="text-xs font-bold text-[#984351] underline"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {filteredMissions.map((mission) => (
                        <div
                          key={mission.id}
                          className={`bg-white border-3 border-[#6E5A52] rounded-[24px] p-5 shadow-[4px_4px_0px_0px_#6E5A52] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-200 ${
                            mission.completed ? "opacity-75 relative bg-[#F3F3FA] border-dashed" : ""
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#F5DACF] border-2 border-black flex items-center justify-center text-2xl shadow-sm">
                              {mission.iconName === "cup" ? "☕" : mission.iconName === "target" ? "🎯" : "💃"}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-base text-[#1A1B20]">{mission.title}</h4>
                                {mission.completed && (
                                  <span className="bg-green-100 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-300">
                                    COMPLETADA ✔️
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed font-semibold">{mission.description}</p>
                              
                              {/* Progress bar inside mission */}
                              <div className="w-full max-w-[200px] pt-1">
                                <div className="flex justify-between items-center text-[10px] font-bold text-[#725E56] mb-1">
                                  <span>Progreso:</span>
                                  <span>{mission.progress}/{mission.maxProgress}</span>
                                </div>
                                <div className="w-full h-3 bg-gray-200 border border-[#6E5A52] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#FB92A1] to-[#984351] transition-all"
                                    style={{ width: `${(mission.progress / mission.maxProgress) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t-2 border-dashed border-[#6E5A52] md:border-none pt-3 md:pt-0">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-mono text-gray-500 uppercase font-bold">Recompensa</span>
                              <span className="font-bold text-sm text-[#984351] font-mono flex items-center gap-0.5 bg-[#F5DACF] border border-black px-2 py-0.5 rounded-lg">
                                <Coins size={12} className="text-amber-500" />
                                +{mission.coinsReward} Coins
                              </span>
                            </div>

                            <button
                              onClick={() => handleMissionAction(mission)}
                              disabled={mission.completed}
                              className={`px-4 py-2 bg-[#FB92A1] hover:bg-[#F27E8F] text-[#400012] border-2 border-[#6E5A52] rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_#6E5A52] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
                                mission.completed ? "opacity-50 pointer-events-none bg-gray-100 text-gray-400 border-gray-400 shadow-none" : ""
                              }`}
                            >
                              {mission.actionText}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flash active mission banner block */}
                  <div className="bg-[#1A1B20] text-white border-3 border-[#6E5A52] rounded-[24px] p-6 shadow-[6px_6px_0px_0px_#984351] relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 text-9xl pointer-events-none">⚡</div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="space-y-2 text-center md:text-left">
                        <span className="bg-[#FB92A1] text-black text-[9px] font-extrabold px-3 py-1 rounded-full uppercase border border-black font-mono">
                          ⚡ Misión Relámpago activa
                        </span>
                        <h4 className="text-xl font-extrabold font-serif mt-2">
                          ¡Doble de monedas por los próximos 15 minutos!
                        </h4>
                        <p className="text-xs text-gray-300 max-w-xl font-semibold">
                          Ordena correctamente el algoritmo de ordenamiento de arepas para ganar un bono extra de 100 monedas de oro. ¡El tiempo vuela, parce!
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab("editor");
                          setWorkspaceBlocks([]);
                        }}
                        className="py-3 px-6 bg-[#FB92A1] hover:bg-[#F27E8F] text-black border-2 border-white rounded-[18px] font-bold text-xs uppercase shadow-[4px_4px_0px_0px_#984351] cursor-pointer"
                      >
                        ¡ACEPTAR AHORA!
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "lecciones" && (
                <div className="space-y-6">
                  {/* Top encouraging status card */}
                  <div className="bg-[#FB92A1] border-3 border-[#6E5A52] rounded-[24px] p-6 shadow-[4px_4px_0px_0px_#6E5A52] flex flex-col md:flex-row items-center gap-6 justify-between text-[#261812]">
                    <div className="space-y-2">
                      <span className="bg-white border border-[#6E5A52] px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider font-mono">
                        Estado Actual • Liga de Oro 🏆
                      </span>
                      <h3 className="text-2xl font-extrabold font-serif">
                        ¡Qué berraquera, vas volando!
                      </h3>
                      <p className="text-xs font-semibold text-[#55433b] max-w-xl">
                        Sigue así, maestro algoritmo. Estás a solo unas lecciones de desbloquear la computación física con micro:bit y el gran torneo nacional de Tejo programado.
                      </p>
                    </div>
                    <div className="text-5xl animate-spin" style={{ animationDuration: "12s" }}>🤠</div>
                  </div>

                  {/* Level map track */}
                  <div className="relative border-l-4 border-dashed border-[#6E5A52] pl-8 ml-6 py-4 space-y-8">
                    {levelsTrack.map((level, idx) => (
                      <div key={level.id} className="relative">
                        {/* Dot marker */}
                        <div className={`absolute -left-[45px] top-4 w-8 h-8 rounded-full border-3 border-[#6E5A52] flex items-center justify-center font-bold text-xs shadow-sm bg-white ${
                          level.status === "completado" ? "bg-green-300" : level.status === "activo" ? "bg-[#FB92A1] animate-ping" : "bg-gray-300"
                        }`}>
                          {level.status === "completado" ? "✔" : level.id}
                        </div>

                        {/* Extra ping marker in active state */}
                        {level.status === "activo" && (
                          <div className="absolute -left-[45px] top-4 w-8 h-8 rounded-full border-3 border-[#6E5A52] flex items-center justify-center font-bold text-xs bg-[#FB92A1]">
                            {level.id}
                          </div>
                        )}

                        {/* Level card block */}
                        <div className={`bg-white border-3 border-[#6E5A52] rounded-[24px] p-5 shadow-[4px_4px_0px_0px_#6E5A52] relative overflow-hidden transition-all duration-200 ${
                          level.status === "bloqueado" ? "opacity-60 bg-[#F3F3FA] border-dashed" : ""
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-gray-500 font-extrabold uppercase bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-md">
                                {level.badgeName}
                              </span>
                              <h4 className="text-lg font-extrabold text-[#1A1B20] pt-1">{level.title}</h4>
                              <p className="text-xs text-gray-600 font-semibold">{level.description}</p>
                            </div>
                            <span className="text-3xl">{level.icons[0]}</span>
                          </div>

                          {/* Progress within level track */}
                          <div className="mt-4 pt-2 border-t-2 border-dashed border-[#EDEDF4]">
                            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold mb-1">
                              <span>Progreso de Estudio:</span>
                              <span className="font-mono text-[#984351]">{level.progress}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 border border-[#6E5A52] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#F5Dacf] to-[#FB92A1]"
                                style={{ width: `${level.progress}%` }}
                              />
                            </div>
                          </div>

                          {(level.status === "activo" || level.status === "completado") && (
                            <button
                              onClick={() => {
                                setSelectedLevelId(level.id);
                                setWorkspaceBlocks([]);
                                setActiveTab("editor");
                              }}
                              className="mt-4 px-4 py-1.5 bg-[#984351] hover:bg-[#7e2c39] text-white border-2 border-black rounded-lg text-xs font-bold shadow-[2px_2px_0px_0px_#000] flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer animate-pulse"
                            >
                              <span>{level.status === "completado" ? "REPETIR RETO" : "EMPEZAR DESAFÍO"}</span>
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "editor" && (
                <div className="space-y-6">
                  {/* Title banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-gray-300 pb-2 gap-4">
                    <div>
                      <h3 className="text-2xl font-extrabold font-serif text-[#984351]">
                        {selectedLevelId === 2 ? "Reto de la Arepa Amasada 🫓" : selectedLevelId === 3 ? "Reto del Tejo con Mecha 🎯" : "Reto de la Changua 🍲"}
                      </h3>
                      <p className="text-xs font-semibold text-gray-600">
                        {selectedLevelId === 2 
                          ? "Misión: Amasa una arepa boyacense calentita con un bucle de repeticiones." 
                          : selectedLevelId === 3 
                          ? "Misión: Usa lógica condicional para lanzar el tejo y hacer Moñona." 
                          : "Misión: Ordena los bloques para preparar el desayuno tradicional bogotano perfecto."
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Challenge level switcher */}
                      <div className="flex items-center gap-1.5 bg-[#EDEDF4] border-2 border-[#6E5A52] rounded-xl px-3 py-1.5 text-xs">
                        <span className="font-bold text-gray-500 uppercase font-mono text-[9px]">Nivel:</span>
                        <select
                          value={selectedLevelId}
                          onChange={(e) => {
                            setSelectedLevelId(Number(e.target.value));
                            setWorkspaceBlocks([]);
                          }}
                          className="font-bold bg-transparent focus:outline-none cursor-pointer text-[#984351]"
                        >
                          <option value={1}>🍲 Changua (Nivel 1)</option>
                          <option value={2}>🫓 Arepa (Nivel 2)</option>
                          {levelsTrack.find(l => l.id === 3)?.status !== "bloqueado" && (
                            <option value={3}>🎯 Tejo (Nivel 3)</option>
                          )}
                        </select>
                      </div>

                      <button
                        onClick={() => runCodeSimulation()}
                        disabled={workspaceBlocks.length === 0}
                        className={`px-5 py-2.5 bg-[#FB92A1] hover:bg-[#F27E8F] text-[#400012] border-3 border-[#6E5A52] rounded-xl font-bold text-xs shadow-[3px_3px_0px_0px_#6E5A52] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50`}
                      >
                        <Play size={14} className="fill-current" />
                        <span>EJECUTAR</span>
                      </button>

                      <button
                        onClick={clearWorkspace}
                        className="p-2.5 bg-white hover:bg-gray-100 text-red-600 border-2 border-[#6E5A52] rounded-xl shadow-[2px_2px_0px_0px_#6E5A52] cursor-pointer"
                        title="Limpiar espacio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Sandbox code block grid layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Available blocks toolbox */}
                    <div className="lg:col-span-4 bg-[#F3F3FA] border-3 border-[#6E5A52] rounded-[24px] p-5 shadow-[4px_4px_0px_0px_#6E5A52] space-y-4">
                      <div className="border-b-2 border-[#6E5A52] pb-2">
                        <span className="font-mono text-[10px] font-bold text-gray-500 uppercase">Bloques disponibles</span>
                        <h4 className="font-extrabold text-sm text-[#1A1B20]">Caja de Bloques</h4>
                      </div>

                      <div className="space-y-2">
                        {getBlocksForLevel(selectedLevelId).map(block => (
                          <div
                            key={block.id}
                            onClick={() => addBlockToWorkspace(block)}
                            className={`${block.color} p-3 border-2 border-[#6E5A52] rounded-xl shadow-[3px_3px_0px_0px_#6E5A52] font-semibold text-xs transition-all active:translate-y-0.5 hover:-translate-y-0.5 cursor-pointer flex items-center justify-between group`}
                          >
                            <span>{block.label}</span>
                            <span className="bg-white/40 border border-[#6E5A52]/20 text-[9px] px-1.5 py-0.5 rounded-lg group-hover:bg-[#984351] group-hover:text-white transition-colors">
                              + AÑADIR
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Active workspace code canvas */}
                    <div className="lg:col-span-8 space-y-4">
                      <div className="bg-white border-3 border-[#6E5A52] rounded-[24px] p-5 shadow-[4px_4px_0px_0px_#6E5A52] min-h-[300px] flex flex-col relative overflow-hidden">
                        
                        <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
                          <FolderOpen size={160} />
                        </div>

                        {/* Top layout banner of workspace */}
                        <div className="flex justify-between items-center text-xs font-bold font-mono text-gray-500 border-b-2 border-[#EDEDF4] pb-2 mb-4">
                          <span>🛠️ Espacio de Trabajo</span>
                          <span>Bloques añadidos: {workspaceBlocks.length}</span>
                        </div>

                        {/* Assembled block sequence */}
                        {workspaceBlocks.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400 border-2 border-dashed border-[#D7D7DE] rounded-xl">
                            <span className="text-4xl filter grayscale mb-2">🧩</span>
                            <p className="font-bold text-sm text-gray-400">Arrastra o haz clic en los bloques para construir tu código algorítmico</p>
                            <p className="text-[11px] text-gray-400 mt-1">Sugerencia: Empieza con el bloque &apos;Al empezar 🏁&apos;</p>
                          </div>
                        ) : (
                          <div className="space-y-2 flex-1">
                            {workspaceBlocks.map((block, index) => (
                              <div key={block.id} className="relative flex items-center pl-6">
                                {/* Vertical connection line simulation */}
                                {index < workspaceBlocks.length - 1 && (
                                  <div className="absolute left-[34px] top-[30px] bottom-[-22px] w-1 bg-[#6E5A52] z-0" />
                                )}

                                {/* Code item visual representation */}
                                <div className="absolute left-1 bg-white border border-[#6E5A52] w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold">
                                  {index + 1}
                                </div>

                                <div className={`${block.color} flex-1 p-3 border-2 border-[#6E5A52] rounded-xl shadow-[2px_2px_0px_0px_#6E5A52] font-semibold text-xs flex items-center justify-between relative z-10`}>
                                  <span>{block.label}</span>
                                  <button
                                    onClick={() => removeBlock(block.id)}
                                    className="p-1 hover:bg-red-100 text-red-600 rounded border border-transparent hover:border-red-300 cursor-pointer"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Interactive Robot Chat Window under Editor workspace */}
                      <div className="bg-[#EDEDF4] border-3 border-[#6E5A52] rounded-[24px] p-4 shadow-[4px_4px_0px_0px_#6E5A52] text-xs flex items-start gap-4">
                        <div className="text-3xl p-1 bg-white border-2 border-[#6E5A52] rounded-xl shadow-[1px_1px_0px_0px_#6E5A52]">🤠</div>
                        <div className="space-y-1">
                          <p className="font-bold text-[#984351] font-mono">API el Robot de la Sabana dice:</p>
                          <p className="font-semibold text-gray-700 italic">
                            {chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].message : "¡Hola, parce! ¿Qué tal si empezamos con poner la olla con leche en la estufa?"}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === "simulacion" && (
                <div className="space-y-6 flex-1">
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-300 pb-2 gap-4">
                    <div>
                      <h3 className="text-2xl font-extrabold font-serif text-[#984351]">
                        {selectedLevelId === 2 ? "Simulador de Arepas 🫓" : selectedLevelId === 3 ? "Simulador de Tejo 🎯" : "Simulador de Cocina 🍲"}
                      </h3>
                      <p className="text-xs font-semibold text-gray-600">
                        {selectedLevelId === 2 
                          ? "Ejecuta tu código para ver si amasas y cocinas una arepa boyacense perfectamente." 
                          : selectedLevelId === 3 
                          ? "Ejecuta tu código para ver si golpeas la mecha con pólvora para estallar la cancha." 
                          : "Ejecuta tu código para ver si cocinas correctamente la receta tradicional de Changua."
                        }
                      </p>
                    </div>

                    <button
                      onClick={runCodeSimulation}
                      disabled={simulationRunning}
                      className="px-5 py-2.5 bg-[#FB92A1] hover:bg-[#F27E8F] text-[#400012] border-3 border-[#6E5A52] rounded-xl font-bold text-xs shadow-[3px_3px_0px_0px_#6E5A52] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={simulationRunning ? "animate-spin" : ""} />
                      <span>{simulationRunning ? "EJECUTANDO..." : "REINICIAR"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left: Ingredients & Steps status Checklist */}
                    <div className="lg:col-span-5 bg-white border-3 border-[#6E5A52] rounded-[24px] p-5 shadow-[4px_4px_0px_0px_#6E5A52] space-y-4">
                      <div>
                        <span className="font-mono text-[9px] text-gray-500 uppercase font-bold">Información del Entorno</span>
                        <h4 className="font-extrabold text-sm text-[#1A1B20]">
                          {selectedLevelId === 2 ? "Ingredientes de la Arepa" : selectedLevelId === 3 ? "Partes de la Cancha" : "Ingredientes de la Changua"}
                        </h4>
                      </div>

                      {/* Ingredient list tags helper */}
                      <div className="grid grid-cols-2 gap-2">
                        {(selectedLevelId === 2 ? [
                          { name: "Harina de maíz", icon: "🥣", status: simProgress >= 25 ? "agregado" : "esperando" },
                          { name: "Agua tibia", icon: "🥛", status: simProgress >= 50 ? "agregado" : "esperando" },
                          { name: "Queso campesino", icon: "🧀", status: simProgress >= 75 ? "agregado" : "esperando" },
                          { name: "Mantequilla", icon: "🧈", status: simProgress >= 100 ? "agregado" : "esperando" }
                        ] : selectedLevelId === 3 ? [
                          { name: "Tejo de metal", icon: "💪", status: simProgress >= 25 ? "listo" : "esperando" },
                          { name: "Greda húmeda", icon: "🎯", status: simProgress >= 50 ? "listo" : "esperando" },
                          { name: "Mecha de pólvora", icon: "🔥", status: simProgress >= 75 ? "listo" : "esperando" },
                          { name: "Moñona gloriosa", icon: "🎉", status: simProgress >= 100 ? "listo" : "esperando" }
                        ] : [
                          { name: "Huevos", icon: "🥚", status: simProgress >= 75 ? "agregado" : "esperando" },
                          { name: "Leche fresca", icon: "🥛", status: simProgress >= 25 ? "agregado" : "esperando" },
                          { name: "Calado (Pan)", icon: "🍞", status: simProgress >= 100 ? "agregado" : "esperando" },
                          { name: "Cilantro picado", icon: "🌿", status: simProgress >= 100 ? "agregado" : "esperando" }
                        ]).map((ing, idx) => (
                          <div key={idx} className="bg-[#EDEDF4] border border-[#6E5A52] p-2 rounded-xl flex items-center gap-2 text-xs font-bold text-[#1A1B20]">
                            <span className="text-lg">{ing.icon}</span>
                            <div className="flex-1">
                              <p className="leading-none">{ing.name}</p>
                              <span className={`text-[8px] uppercase tracking-wider font-mono ${ing.status === "agregado" || ing.status === "listo" ? "text-green-600 font-extrabold" : "text-gray-400"}`}>
                                {ing.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Steps checklist items */}
                      <div className="border-t-2 border-dashed border-[#EDEDF4] pt-4 space-y-3">
                        <span className="font-mono text-[9px] text-gray-500 uppercase font-bold">Progreso de ejecución ({simProgress}%)</span>
                        
                        <div className="w-full h-4 bg-gray-200 border-2 border-black rounded-full overflow-hidden mb-4">
                          <div
                            className="h-full bg-gradient-to-r from-red-400 to-[#984351] transition-all duration-500"
                            style={{ width: `${simProgress}%` }}
                          />
                        </div>

                        <div className="space-y-2">
                          {simStepsHistory.map((step, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-3 border-2 rounded-xl text-xs font-bold ${
                                step.status === "success" ? "bg-green-50 border-green-600 font-bold" :
                                step.status === "error" ? "bg-red-50 border-red-600 text-red-800" :
                                "bg-white border-[#D7D7DE] text-gray-500"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full border border-black flex items-center justify-center font-mono text-[10px] font-extrabold ${
                                  step.status === "success" ? "bg-green-300" : step.status === "error" ? "bg-red-300" : "bg-gray-100"
                                }`}>
                                  {idx + 1}
                                </span>
                                <span>{step.step}</span>
                              </span>

                              {step.status === "success" && <CheckCircle2 size={16} className="text-green-600" />}
                              {step.status === "error" && <AlertCircle size={16} className="text-red-600" />}
                              {step.status === "pending" && <span className="font-mono text-[10px]">Esperando...</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Visual simulator stage */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="bg-white border-3 border-[#6E5A52] rounded-[36px] p-10 shadow-[4px_4px_0px_0px_#6E5A52] flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
                        {simConfetti && (
                          <div className="absolute inset-0 bg-green-50/95 z-20 pointer-events-none flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                            <span className="text-6xl animate-bounce">
                              {selectedLevelId === 2 ? "🫓🤠🏆" : selectedLevelId === 3 ? "💥🎯🏆" : "🎉🍲🏆"}
                            </span>
                            <h4 className="font-extrabold text-xl text-green-800 mt-3 font-serif uppercase tracking-tight">
                              {selectedLevelId === 2 ? "¡AREPA PERFECTA!" : selectedLevelId === 3 ? "¡MONONA ESPECTACULAR!" : "¡CHANGUA LOGRADA!"}
                            </h4>
                            <p className="text-xs text-green-700 font-bold font-mono bg-green-100 px-3 py-1.5 border border-green-300 rounded-full mt-2">
                              Consigues +{selectedLevelId === 2 ? 50 : selectedLevelId === 3 ? 75 : 35} Monedas de Oro 🪙
                            </p>
                          </div>
                        )}

                        <div className="relative">
                          {/* Steam/Blast indicators */}
                          {simulationRunning && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-4 text-gray-400">
                              <span className="text-3xl animate-bounce" style={{ animationDelay: "0ms" }}>
                                {selectedLevelId === 3 ? "✨" : "♨️"}
                              </span>
                              <span className="text-2xl animate-bounce" style={{ animationDelay: "300ms" }}>
                                {selectedLevelId === 2 ? "🥖" : "♨️"}
                              </span>
                              <span className="text-3xl animate-bounce" style={{ animationDelay: "150ms" }}>
                                {selectedLevelId === 3 ? "🧨" : "♨️"}
                              </span>
                            </div>
                          )}

                          {selectedLevelId === 2 ? (
                            /* Budare Hotplate Grill */
                            <div className={`w-52 h-44 border-4 border-[#6E5A52] rounded-full relative px-4 flex flex-col justify-end bg-gradient-to-b from-gray-700 to-gray-900 shadow-[8px_8px_0px_0px_#6E5A52] transition-transform duration-300 ${
                              simulationRunning ? "scale-105" : ""
                            }`}>
                              <div className="absolute inset-4 rounded-full border-4 border-dashed border-yellow-500/20 animate-spin z-0" style={{ animationDuration: "10s" }} />
                              <div className="absolute bottom-[-16px] left-8 right-8 h-4 bg-gray-500 border-4 border-[#6E5A52] rounded-full z-0" />
                              
                              <div
                                className="w-full bg-gradient-to-t from-yellow-300 to-yellow-500 border-3 border-[#6E5A52] rounded-full transition-all duration-1000 z-10 opacity-90 text-center flex flex-col items-center justify-center p-2 mb-6"
                                style={{ height: `${Math.max(simProgress, 20)}%` }}
                              >
                                <span className="text-4xl mt-1">
                                  {simProgress >= 100 ? "🫓" : simProgress >= 75 ? "🧀" : simProgress >= 25 ? "🥣" : "🥛"}
                                </span>
                              </div>
                            </div>
                          ) : selectedLevelId === 3 ? (
                            /* Cancha de Tejo */
                            <div className={`w-52 h-44 border-4 border-[#6E5A52] rounded-[24px] relative px-4 flex flex-col justify-end bg-gradient-to-b from-[#7A3F26] to-[#542B1A] shadow-[8px_8px_0px_0px_#6E5A52] transition-transform duration-300 ${
                              simulationRunning ? "scale-105" : ""
                            }`}>
                              <div className="absolute inset-2 border-2 border-dashed border-[#F5DACF]/10 text-[8px] font-mono font-bold text-[#F5DACF]/30 text-center pt-2">
                                CANCHA DE GREDA TURMEQUÉ
                              </div>
                              <div className="absolute bottom-[-16px] left-[-10px] right-[-10px] h-4 bg-yellow-900 border-4 border-[#6E5A52] rounded-full z-0" />
                              
                              <div
                                className="w-full bg-gradient-to-t from-gray-300 to-zinc-400 border-t-3 border-[#6E5A52] rounded-t-[30px] transition-all duration-1000 z-10 opacity-95 text-center flex flex-col items-center justify-center p-2 mb-2"
                                style={{ height: `${Math.max(simProgress, 20)}%` }}
                              >
                                <span className="text-4xl">
                                  {simProgress >= 100 ? "💥" : simProgress >= 75 ? "🎯" : simProgress >= 25 ? "💪" : "⚖️"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Changua Soup cooking Pot */
                            <div className={`w-52 h-44 border-4 border-[#6E5A52] rounded-b-[48px] rounded-t-[16px] relative px-4 flex flex-col justify-end bg-gradient-to-b from-[#F5DACF] to-[#E0BFBE] shadow-[8px_8px_0px_0px_#6E5A52] transition-transform duration-300 ${
                              simulationRunning ? "scale-105" : ""
                            }`}>
                              <div className="absolute left-[-20px] top-[40px] w-6 h-10 border-4 border-[#6E5A52] rounded-l-lg bg-[#E2E2E9]" />
                              <div className="absolute right-[-20px] top-[40px] w-6 h-10 border-4 border-[#6E5A52] rounded-r-lg bg-[#E2E2E9]" />
                              <div className="absolute bottom-[-16px] left-[-24px] right-[-24px] h-4 bg-gray-200 border-4 border-[#6E5A52] rounded-full z-0" />
                              {simulationRunning && (
                                <div className="absolute bottom-[-22px] left-1/4 right-1/4 h-2 bg-red-500 rounded-full animate-pulse blur-[1px]" />
                              )}
                              
                              <div
                                className="w-full bg-gradient-to-t from-white to-[#F5DACF] border-t-3 border-[#6E5A52] rounded-b-[40px] transition-all duration-1000 z-10 opacity-90 text-center flex flex-col items-center justify-center p-2"
                                style={{ height: `${Math.max(simProgress, 15)}%` }}
                              >
                                <span className="text-2xl mt-1">
                                  {simProgress >= 100 ? "🍲" : simProgress >= 75 ? "🥚" : simProgress >= 25 ? "🥛" : ""}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Simulator dialog speech tip */}
                        <div className="w-full mt-10 p-4 bg-[#F5DACF] border-2 border-black rounded-[24px] shadow-[2px_2px_0px_0px_#000] text-xs flex items-start gap-4">
                          <span className="text-3xl">🤖</span>
                          <div>
                            <p className="font-extrabold text-[#725E56] font-mono">Consola de Simulación:</p>
                            <p className="font-bold text-[#1A1B20] mt-0.5">{simMessage}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === "perfil" && (
                <div className="space-y-6">
                  {/* Big visual stats profile */}
                  <div className="bg-white border-3 border-[#6E5A52] rounded-[24px] p-6 shadow-[4px_4px_0px_0px_#6E5A52] flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full bg-[#FB92A1] border-3 border-black text-5xl flex items-center justify-center shadow-lg">
                      🤠
                    </div>
                    <div className="mt-3 space-y-1">
                      <h3 className="text-2xl font-extrabold font-serif text-[#1A1B20]">Mateo Jiménez</h3>
                      <p className="text-xs font-mono font-bold uppercase text-[#984351] tracking-wider">
                        💻 Explorador de Algoritmos • Grado 6A
                      </p>
                    </div>

                    {/* Progress slider bar towards next level */}
                    <div className="w-full max-w-lg mt-6 pt-4 border-t-2 border-dashed border-[#EDEDF4]">
                      <div className="flex justify-between items-center text-xs font-bold text-[#725E56] mb-1 font-mono">
                        <span>Experiencia (XP)</span>
                        <span>450 / 600 XP</span>
                      </div>
                      <div className="w-full h-4 bg-gray-200 border-2 border-black rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 transition-all" style={{ width: "75%" }} />
                      </div>
                    </div>
                  </div>

                  {/* Achievements and trophies gained */}
                  <div className="bg-white border-3 border-[#6E5A52] rounded-[24px] p-6 shadow-[4px_4px_0px_0px_#6E5A52] space-y-4">
                    <div className="border-b-2 border-gray-100 pb-2">
                      <h4 className="font-extrabold text-base text-[#6E5A52] font-serif">🏅 Logros Ganados</h4>
                      <p className="text-xs text-gray-500 font-semibold">Tus medallas ganadas programando algoritmos.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {ACHIEVEMENTS.map(ach => (
                        <div key={ach.id} className="bg-[#F3F3FA] border-2 border-[#6E5A52] rounded-xl p-4 flex flex-col items-center text-center hover:scale-102 transition-transform shadow-[2px_2px_0px_0px_#6E5A52]">
                          <span className="text-4xl p-2 bg-white border border-[#6E5A52] rounded-full shadow-sm mb-2">{ach.icon}</span>
                          <h5 className="font-extrabold text-xs text-[#1A1B20]">{ach.title}</h5>
                          <p className="text-[10px] text-gray-500 leading-snug font-semibold mt-1">{ach.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulation configuration and sound panel */}
                  <div className="bg-white border-3 border-[#6E5A52] rounded-[24px] p-5 shadow-[4px_4px_0px_0px_#6E5A52] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-[#1A1B20]">Ajustes de Sonido</h4>
                      <p className="text-xs text-gray-500">Modula los sonidos recreativos en las simulaciones.</p>
                    </div>

                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-[#6E5A52] rounded-xl text-xs font-bold shadow-[2px_2px_0px_0px_#000] bg-white group cursor-pointer"
                    >
                      {soundEnabled ? (
                        <>
                          <Volume2 size={16} className="text-green-600" />
                          <span>Sonido Activado</span>
                        </>
                      ) : (
                        <>
                          <VolumeX size={16} className="text-gray-400" />
                          <span>Sonido Silenciado</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

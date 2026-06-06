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
import { CodeBlock, Mission, Achievement, BlockCodeAST, ChatMessage } from "../types";
import { INITIAL_BLOCKS, INITIAL_MISSIONS, LEVELS_TRACK, ACHIEVEMENTS } from "../data";

interface StudentAppProps {
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  missions: Mission[];
  setMissions: React.Dispatch<React.SetStateAction<Mission[]>>;
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
  studentAST,
  setStudentAST,
  chatHistory,
  setChatHistory,
  coachMode
}: StudentAppProps) {
  // Navigation tabs inside student interface
  const [activeTab, setActiveTab] = useState<"misiones" | "lecciones" | "editor" | "simulacion" | "perfil">("misiones");
  
  // Search & filter states for missions
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
      setActiveTab("editor");
      if (coachMode !== "Silent") {
        addChatMessage("api", "¡Listo para preparar el tinto! Necesitamos calentar la olla, echar el agua de panela, el café y colar. ¡Arma tu secuencia!");
      }
    } else if (mission.id === "m2") {
      // "Lanzar Tejo boyacense"
      // increment progress
      setMissions(prev => prev.map(m => {
        if (m.id === "m2") {
          const nextProg = m.progress + 1;
          const isDone = nextProg >= m.maxProgress;
          if (isDone) {
            setCoins(c => c + m.coinsReward);
          }
          return { ...m, progress: nextProg, completed: isDone };
        }
        return m;
      }));
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

    // Dynamic sequence check
    const sequenceTypes = workspaceBlocks.map(b => b.type);
    
    // Initialise simulation steps
    const stepsTrack = [
      { step: "Calentar la olla con leche", status: "pending" as const },
      { step: "Hervir al punto perfecto", status: "pending" as const },
      { step: "Cocinar los huevos suaves", status: "pending" as const },
      { step: "Adicionar el calado crujiente", status: "pending" as const }
    ];
    setSimStepsHistory(stepsTrack);

    // Let's call the server endpoint to evaluate if workspace is active, or use local sandbox
    // Simulate steps with setTimeout
    let currentStep = 0;
    
    // Core recipe logic: 
    // 1. al_empezar
    // 2. poner_olla
    // 3. esperar_hervir
    // 4. agregar_huevos
    // 5. agregar_calado / picar_cilantro
    const correctSeq = ["al_empezar", "poner_olla", "esperar_hervir", "agregar_huevos", "agregar_calado"];

    const interval = setInterval(() => {
      if (currentStep < 4) {
        setSimStepIndex(currentStep);
        const seqToMatch = correctSeq.slice(0, currentStep + 2); // al_empezar + next stages
        const actualSeqSlice = sequenceTypes.slice(0, currentStep + 2);
        
        let hasError = false;
        // Verify sequencing
        if (sequenceTypes[0] !== "al_empezar") {
          hasError = true;
          setSimMessage("❌ Error: ¡No iniciaste con el bloque 🏁 'Al empezar'! El robot no sabe cuándo arrancar.");
        } else if (currentStep === 0 && !sequenceTypes.includes("poner_olla")) {
          hasError = true;
          setSimMessage("❌ Error: Falta poner la olla en la estufa. ¡No podemos hervir leche en la nada!");
        } else if (currentStep === 1 && sequenceTypes.indexOf("esperar_hervir") < sequenceTypes.indexOf("poner_olla")) {
          hasError = true;
          setSimMessage("❌ Error: ¡Echaste leche antes de prender el fuego o esperaste hervir sin olla! Se quemó el desayuno.");
        } else if (currentStep === 2 && sequenceTypes.indexOf("agregar_huevos") < sequenceTypes.indexOf("esperar_hervir")) {
          hasError = true;
          setSimMessage("❌ Error: ¡Agregaste los huevos antes de que la leche hirviera! Quedó un caldo baboso crudo.");
        }

        if (hasError) {
          setSimulationRunning(false);
          setSimStepsHistory(prev => prev.map((s, idx) => idx === currentStep ? { ...s, status: "error" as const } : s));
          clearInterval(interval);
          
          if (coachMode !== "Silent") {
            let robotCritique = "¡Caray, mi llave! Los huevos quedaron crudos y la leche fría. Recuerda: 1. Al empezar 🏁 -> 2. Poner olla 🍲 -> 3. Esperar a que hierva ⏳. ¡Intenta reordenar los bloques!";
            if (coachMode === "Technical") {
              robotCritique = "ANÁLISIS ESTÁTICO (Modo Técnico): Ocurrió una transgresión de flujo secuencial. Condición temporal fallida. El subproceso 'agregar_huevos' requiere la precondición 'esperar_hervir' activa.";
            }
            addChatMessage("api", robotCritique);
          }
          return;
        }

        // Advance step
        setSimStepsHistory(prev => prev.map((s, idx) => idx === currentStep ? { ...s, status: "success" as const } : s));
        setSimProgress((prev) => Math.min(prev + 25, 100));

        let stepText = "";
        switch (currentStep) {
          case 0: stepText = "La estufa está encendida. La olla con leche, sal y agua se calienta lentamente."; break;
          case 1: stepText = "¡Esa leche ya está hirviendo, subiendo con espuma! Ahora toca el huevo."; break;
          case 2: stepText = "Echamos los huevos despacito. Esperando 3 minutos a que cuajen perfectamente."; break;
          case 3: stepText = "Agregando el calado boyacense de pan crujiente y espolvoreando cilantro verde sabroso. ¡Rico!"; break;
        }
        setSimMessage(`🔥 cocinando: ${stepText}`);
        currentStep++;
      } else {
        // Complete!
        setSimulationRunning(false);
        setSimProgress(100);
        setSimConfetti(true);
        setSimMessage("🎉 ¡ÉXITO! Serviste una changua bogotana espectacular en plato de barro. ¡Pura sazón de la abuela!");
        clearInterval(interval);
        
        // Reward
        setCoins(prev => prev + 35);
        if (coachMode !== "Silent") {
          addChatMessage("api", "¡Qué berraquera, parce! Lograste ordenar los bloques con una precisión de chef profesional de la Sabana. ¡Completaste el Nivel 1!");
        }
      }
    }, 1800);
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
                    {LEVELS_TRACK.map((level, idx) => (
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

                          {level.status === "activo" && (
                            <button
                              onClick={() => setActiveTab("editor")}
                              className="mt-4 px-4 py-1.5 bg-[#984351] hover:bg-[#7e2c39] text-white border-2 border-black rounded-lg text-xs font-bold shadow-[2px_2px_0px_0px_#000] flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                            >
                              <span>CONOCER ALGORITMO</span>
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
                        Reto de la Changua 🍲
                      </h3>
                      <p className="text-xs font-semibold text-gray-600">
                        Misión: Ordena los bloques para preparar el desayuno tradicional bogotano perfecto.
                      </p>
                    </div>

                    <div className="flex gap-2">
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
                        {INITIAL_BLOCKS.map(block => (
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
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-300 pb-2 gap-4">
                    <div>
                      <h3 className="text-2xl font-extrabold font-serif text-[#984351]">
                        Simulador de Cocina 🍲
                      </h3>
                      <p className="text-xs font-semibold text-gray-600">
                        Ejecuta tu código para ver si cocinas correctamente la receta tradicional de Changua.
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
                        <span className="font-mono text-[9px] text-gray-500 uppercase font-bold">Información de receta</span>
                        <h4 className="font-extrabold text-sm text-[#1A1B20]">Broth & Ingredientes</h4>
                      </div>

                      {/* Ingredient list tags */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: "Huevos", icon: "🥚", status: simProgress >= 75 ? "agregado" : "esperando" },
                          { name: "Leche fresca", icon: "🥛", status: simProgress >= 25 ? "agregado" : "esperando" },
                          { name: "Calado (Pan)", icon: "🍞", status: simProgress >= 100 ? "agregado" : "esperando" },
                          { name: "Cilantro picado", icon: "🌿", status: simProgress >= 100 ? "agregado" : "esperando" }
                        ].map((ing, idx) => (
                          <div key={idx} className="bg-[#EDEDF4] border border-[#6E5A52] p-2 rounded-xl flex items-center gap-2 text-xs font-bold text-[#1A1B20]">
                            <span className="text-lg">{ing.icon}</span>
                            <div className="flex-1">
                              <p className="leading-none">{ing.name}</p>
                              <span className={`text-[8px] uppercase tracking-wider font-mono ${ing.status === "agregado" ? "text-green-600 font-extrabold" : "text-gray-400"}`}>
                                {ing.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Steps checklist items */}
                      <div className="border-t-2 border-dashed border-[#EDEDF4] pt-4 space-y-3">
                        <span className="font-mono text-[9px] text-gray-500 uppercase font-bold">Progreso de cocina ({simProgress}%)</span>
                        
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
                          <div className="absolute inset-0 bg-green-100/50 pointer-events-none flex flex-col items-center justify-center text-center p-4">
                            <span className="text-5xl animate-bounce">🎉🍲🏆</span>
                            <h4 className="font-bold text-lg text-green-800 mt-2 font-serif">¡EXCELENTE TRABAJO!</h4>
                            <p className="text-xs text-green-700 font-bold font-mono">Consigue +35 Coins</p>
                          </div>
                        )}

                        {/* Heated steaming pot simulated illustration */}
                        <div className="relative">
                          {/* Steam indicators */}
                          {simulationRunning && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-4 text-gray-400">
                              <span className="text-3xl animate-bounce" style={{ animationDelay: "0ms" }}>♨️</span>
                              <span className="text-2xl animate-bounce" style={{ animationDelay: "300ms" }}>♨️</span>
                              <span className="text-3xl animate-bounce" style={{ animationDelay: "150ms" }}>♨️</span>
                            </div>
                          )}

                          {/* Cooking Pot */}
                          <div className={`w-52 h-44 border-4 border-[#6E5A52] rounded-b-[48px] rounded-t-[16px] relative px-4 flex flex-col justify-end bg-gradient-to-b from-[#F5DACF] to-[#E0BFBE] shadow-[8px_8px_0px_0px_#6E5A52] transition-transform duration-300 ${
                            simulationRunning ? "scale-105" : ""
                          }`}>
                            {/* Pot handles */}
                            <div className="absolute left-[-20px] top-[40px] w-6 h-10 border-4 border-[#6E5A52] rounded-l-lg bg-[#E2E2E9]" />
                            <div className="absolute right-[-20px] top-[40px] w-6 h-10 border-4 border-[#6E5A52] rounded-r-lg bg-[#E2E2E9]" />

                            {/* Warm stove platform */}
                            <div className="absolute bottom-[-16px] left-[-24px] right-[-24px] h-4 bg-gray-200 border-4 border-[#6E5A52] rounded-full z-0" />
                            {simulationRunning && (
                              <div className="absolute bottom-[-22px] left-1/4 right-1/4 h-2 bg-red-500 rounded-full animate-pulse blur-[1px]" />
                            )}

                            {/* Liquid fill animation */}
                            <div
                              className="w-full bg-gradient-to-t from-white to-[#F5DACF] border-t-3 border-[#6E5A52] rounded-b-[40px] transition-all duration-1000 z-10 opacity-90 text-center flex flex-col items-center justify-center p-2"
                              style={{ height: `${Math.max(simProgress, 15)}%` }}
                            >
                              <span className="text-2xl mt-1">
                                {simProgress >= 100 ? "🍲" : simProgress >= 75 ? "🍳" : simProgress >= 25 ? "🥛" : ""}
                              </span>
                            </div>
                          </div>
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

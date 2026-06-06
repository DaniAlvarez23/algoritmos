/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CodeBlock, Mission, Achievement, ClassStudent } from "./types";

export const INITIAL_BLOCKS: CodeBlock[] = [
  { id: "al_empezar", type: "al_empezar", label: "Al empezar 🏁", color: "bg-[#FB92A1] text-[#261812]" },
  { id: "poner_olla", type: "poner_olla", label: "Poner olla con leche en estufa 🍲", color: "bg-[#F5DACF] text-[#400012]" },
  { id: "esperar_hervir", type: "esperar_hervir", label: "Esperar a que hierva ⏳", color: "bg-[#E0BFBE] text-[#291616]" },
  { id: "agregar_huevos", type: "agregar_huevos", label: "Agregar huevos 🥚", color: "bg-[#FFD9DD] text-[#400012]" },
  { id: "agregar_calado", type: "agregar_calado", label: "Agregar calado (pan) 🍞", color: "bg-[#DBC1B7] text-[#261812]" },
  { id: "picar_cilantro", type: "picar_cilantro", label: "Picar cilantro fresco 🌿", color: "bg-[#E2E2E9] text-[#1A1B20]" }
];

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: "m1",
    title: "Preparar el tinto ☕",
    description: "Completa el reto de secuencia básica para el desayuno del abuelo.",
    coinsReward: 20,
    completed: false,
    progress: 0,
    maxProgress: 1,
    actionText: "EMPEZAR",
    iconName: "cup"
  },
  {
    id: "m2",
    title: "Moñona Boyacense 🎯",
    description: "Usa un condicional 'if' en el simulador de tejo profesional boyacense.",
    coinsReward: 50,
    completed: false,
    progress: 0,
    maxProgress: 3,
    actionText: "LANZAR TEJO",
    iconName: "target"
  },
  {
    id: "m3",
    title: "Cumbia Algorítmica 💃",
    description: "Crea un bucle para repetir 4 pasos de baile tradicional del Caribe.",
    coinsReward: 30,
    completed: true,
    progress: 1,
    maxProgress: 1,
    actionText: "RECLAMADO",
    iconName: "music"
  }
];

export const LEVELS_TRACK = [
  {
    id: 1,
    title: "Maestro de Secuencias",
    badgeName: "NIVEL 1",
    status: "completado" as const,
    progress: 100,
    description: "Domina el orden lineal de las instrucciones en la cocina de Changua.",
    icons: ["🎵", "🏛️", "🌲"]
  },
  {
    id: 2,
    title: "Chef de Bucles",
    badgeName: "EN PROGRESO",
    status: "activo" as const,
    progress: 60,
    description: "Aprende a repetir acciones como quien amasa una buena arepa.",
    icons: ["🍲", "🍳", "🍽️"]
  },
  {
    id: 3,
    title: "Lógica del Tejo (Condicional)",
    badgeName: "NIVEL 3",
    status: "bloqueado" as const,
    progress: 0,
    description: "Completa 'Chef de Bucles' para desbloquear condicionales con mechas y tejos.",
    icons: ["🔒"]
  }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "ach_1",
    title: "Chef de la Changua 🍲",
    icon: "🍴",
    description: "Ordenaste correctamente una receta secuencial tradicional sin derrames."
  },
  {
    id: "ach_2",
    title: "Maestro del Sombrero 🤠",
    icon: "👒",
    description: "Interactuaste con API el Robot usando más de 5 modismos colombianos."
  },
  {
    id: "ach_3",
    title: "Lector Veloz 📖",
    icon: "📚",
    description: "Leíste los fundamentos teóricos de Al-Juarismi y Turing en el rincón histórico."
  }
];

export const INITIAL_STUDENTS: ClassStudent[] = [
  {
    id: "st_1",
    name: "Sofía Herrera",
    grade: "Grado 6A",
    avatar: "👩‍🎨",
    readingSpeed: 92,
    levelingProgress: 92,
    status: "Excelente",
    subject: "Pensamiento Algorítmico",
    chatHistory: [
      { sender: "api", message: "¡Hola Sofía! ¿Cómo va ese algoritmo de la cumbia?", timestamp: new Date().toISOString() },
      { sender: "student", message: "¡Hola API! Lo logré haciendo que repita 4 veces el paso adelante y atrás.", timestamp: new Date().toISOString() }
    ],
    codeAST: {
      blocks: [
        { id: "b1", type: "al_empezar", next_block_id: "b2" },
        { id: "b2", type: "mover_adelante", next_block_id: "b3" },
        { id: "b3", type: "repetir_loop", next_block_id: null, parameters: { times: 4 } }
      ]
    }
  },
  {
    id: "st_2",
    name: "Diego Ruiz",
    grade: "Grado 6B",
    avatar: "👦",
    readingSpeed: 55,
    levelingProgress: 65,
    status: "En Progreso",
    subject: "Pensamiento Algorítmico",
    chatHistory: [
      { sender: "api", message: "¡Buenas, Diego! Vamos a ordenar la receta del café.", timestamp: new Date().toISOString() }
    ],
    codeAST: {
      blocks: [
        { id: "b1", type: "al_empezar", next_block_id: "b2" },
        { id: "b2", type: "moler_cafe", next_block_id: null }
      ]
    }
  },
  {
    id: "st_3",
    name: "Lucía Mendez",
    grade: "Grado 6A",
    avatar: "👧",
    readingSpeed: 84,
    levelingProgress: 88,
    status: "Óptimo",
    subject: "Pensamiento Algorítmico",
    chatHistory: [],
    codeAST: { blocks: [] }
  },
  {
    id: "st_4",
    name: "Mateo Jiménez",
    grade: "Grado 6A",
    avatar: "🤠",
    readingSpeed: 45,
    levelingProgress: 60,
    status: "Atención",
    subject: "Pensamiento Algorítmico",
    inactiveMinutes: 15,
    errorsCount: 5,
    recentTopic: "Fracciones y Algoritmos",
    chatHistory: [
      { sender: "api", message: "¡Hola Mateo! Recuerda que para cocinar la changua debes calentar la leche primero.", timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
      { sender: "student", message: "No sé cómo hacer para que no esté crudo el huevo.", timestamp: new Date(Date.now() - 13 * 60 * 1000).toISOString() },
      { sender: "api", message: "¡No te preocupes, parce! Piensa en qué orden harías esto en la estufa real. ¿Primero echas el calado o pones a hervir la leche con sal?", timestamp: new Date(Date.now() - 11 * 60 * 1000).toISOString() }
    ],
    codeAST: {
      blocks: [
        { id: "b1", type: "al_empezar", next_block_id: "b2" },
        { id: "b2", type: "agregar_huevos", next_block_id: "b3" },
        { id: "b3", type: "poner_olla", next_block_id: null }
      ]
    }
  }
];

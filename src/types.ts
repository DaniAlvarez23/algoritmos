/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CodeBlock {
  id: string;
  type: string; // e.g. "comenzar", "poner_olla", "esperar_hervir", "agregar_huevos", "agregar_calado", "agregar_leche", "picar_cilantro"
  label: string;
  color: string; // Tailwind color class
}

export interface StudentSession {
  user_id: string;
  current_phase: number; // 1 to 4
  current_level: number;
  current_mode: "Heuristic" | "Technical" | "Automatic" | "Silent";
}

export interface BlockCodeAST {
  blocks: {
    id: string;
    type: string;
    next_block_id: string | null;
    parameters?: Record<string, any>;
  }[];
}

export interface ChatMessage {
  sender: "student" | "api";
  message: string;
  timestamp: string; // ISO String
}

export interface AIResponse {
  internal_reasoning: {
    concept_to_teach: string;
    analogy_selected: string;
    didactic_strategy: string;
  };
  student_visible_response: string;
  scaffolding_evaluation: {
    is_correct_execution: boolean;
    error_type_detected: string | null;
    suggested_orchestrator_mode: "Heuristic" | "Technical" | "Silent";
  };
}

// Student profile & progress
export interface StudentStats {
  coins: number;
  streak: number;
  missionsCompleted: number;
  rankInClass: number;
  xp: number;
  levelProgress: number; // e.g., 65
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  coinsReward: number;
  completed: boolean;
  progress: number; // e.g., 0 or 1
  maxProgress: number; // e.g., 1
  actionText: string;
  iconName: string;
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  dateEarned?: string;
}

export interface ClassStudent {
  id: string;
  name: string;
  grade: string;
  avatar: string;
  readingSpeed: number; // percentage, e.g. 92
  levelingProgress: number; // percentage, e.g 65
  status: "Excelente" | "En Progreso" | "Óptimo" | "Atención";
  subject: "Matemáticas Avanzadas" | "Ciencias Naturales" | "Comprensión Lectora" | "Pensamiento Algorítmico";
  inactiveMinutes?: number;
  errorsCount?: number;
  recentTopic?: string;
  chatHistory: ChatMessage[];
  codeAST: BlockCodeAST;
}

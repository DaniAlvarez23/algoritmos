/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { LogIn, Compass, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface LoginScreenProps {
  onLogin: (role: "student" | "teacher", name: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher">("student");
  const [userName, setUserName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      onLogin(selectedRole, userName.trim());
    } else {
      // Default fallback
      onLogin(selectedRole, selectedRole === "student" ? "Mateo Jiménez" : "Profra. Jenifer Maigual");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FF] p-6 flex flex-col items-center justify-center font-sans text-[#1A1B20]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border-4 border-[#6E5A52] rounded-[24px] shadow-[8px_8px_0px_0px_#6E5A52] p-8 relative overflow-hidden"
      >
        {/* Banner decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[#984351]" />

        {/* Top brand header */}
        <div className="text-center mt-4 mb-6">
          <span className="bg-[#F5DACF] text-[#725E56] border-2 border-[#6E5A52] font-mono text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            ⚡ Aprendizaje Vibrante
          </span>
          <h1 className="font-extrabold text-3xl font-serif text-[#1A1B20] tracking-tight mt-3">
            ¡Hola, Explorador! 🤠
          </h1>
          <p className="text-sm text-[#544244] mt-2">
            La plataforma interactiva de programación para mentes intrépidas de grado 6°.
          </p>
        </div>

        {/* Big visual mascot card */}
        <div className="bg-[#F5DACF] border-3 border-[#6E5A52] rounded-[18px] p-4 flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_#6E5A52] mb-6">
          {/* Avatar simulation using neat CSS */}
          <div className="w-24 h-24 rounded-full bg-white border-3 border-[#6E5A52] p-1 flex items-center justify-center relative overflow-hidden shadow-inner">
            <span className="text-5xl">🤠</span>
            <div className="absolute bottom-0 bg-[#984351] text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white">
              API ROBOT
            </div>
          </div>
          <div className="text-center mt-3">
            <p className="font-mono text-xs text-[#725E56] font-bold">
              "¡Qué berraquera, parce! Estás a un clic de iniciar tu gran aventura."
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#EDEDF4] border-2 border-[#6E5A52] rounded-full">
            <button
              type="button"
              onClick={() => setSelectedRole("student")}
              className={`py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 ${
                selectedRole === "student"
                  ? "bg-[#984351] text-white border-2 border-[#6E5A52] shadow-sm"
                  : "text-[#544244] hover:bg-[#E8E7EF]"
              }`}
            >
              👩‍🎓 Estudiante
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("teacher")}
              className={`py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 ${
                selectedRole === "teacher"
                  ? "bg-[#984351] text-white border-2 border-[#6E5A52] shadow-sm"
                  : "text-[#544244] hover:bg-[#E8E7EF]"
              }`}
            >
              👩‍🏫 Docente
            </button>
          </div>

          {/* Name input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#544244] font-mono">
              Escribe tu nombre de usuario:
            </label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={selectedRole === "student" ? "Mateo Jiménez..." : "Profesor(a)..."}
              className="w-full bg-white border-3 border-[#6E5A52] rounded-[16px] px-4 py-3 text-sm focus:outline-none focus:border-[#984351] transition-all font-bold placeholder:text-gray-400"
            />
          </div>

          {/* Actions */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#FB92A1] hover:bg-[#F27E8F] text-[#400012] border-3 border-[#6E5A52] rounded-[18px] shadow-[4px_4px_0px_0px_#6E5A52] font-bold text-sm tracking-wide transition-all active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogIn size={18} />
            <span>Ingresar al Sistema</span>
            <ArrowRight size={16} className="ml-1" />
          </button>
        </form>

        {/* Separator lines or other links */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => onLogin(selectedRole, selectedRole === "student" ? "Mateo Jiménez" : "Profra. Jenifer Maigual")}
            className="text-xs font-bold text-[#984351] hover:underline flex items-center gap-1 bg-[#EDEDF4] hover:bg-[#E8E7EF] border-2 border-[#6E5A52] px-3 py-1.5 rounded-full"
          >
            <Compass size={14} />
            Iniciar sesión rápida con Google
          </button>
          <span className="text-[10px] text-gray-500 font-mono mt-2 block text-center">
            Versión 2.4.0 • Cumplimiento Ley 1581 (Habeas Data)
          </span>
        </div>
      </motion.div>
    </div>
  );
}

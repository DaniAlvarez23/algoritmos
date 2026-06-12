/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { LogIn, Compass, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface LoginScreenProps {
  onLogin: (role: "student" | "teacher", name: string) => void;
  onGoogleLogin: (role: "student" | "teacher") => Promise<void>;
  isLoadingFirebase?: boolean;
}

export default function LoginScreen({ onLogin, onGoogleLogin, isLoadingFirebase = false }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher">("student");
  const [userName, setUserName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      onLogin(selectedRole, userName.trim());
    } else {
      // Default fallback
      onLogin(selectedRole, selectedRole === "student" ? "Mateo Jiménez" : "Profra. Jenifer Maigual");
    }
  };

  const handleGoogleClick = async () => {
    setAuthError(null);
    try {
      if (onGoogleLogin) {
        await onGoogleLogin(selectedRole);
      }
    } catch (e: any) {
      console.error("Error in Google Sign-In: ", e);
      const errMsg = e?.message || String(e);
      let friendlyError = errMsg;

      if (errMsg.includes("auth/unauthorized-domain") || errMsg.includes("unauthorized-domain")) {
        friendlyError = `¡Ups! Este dominio no está autorizado en tu proyecto de Firebase.\n\n` +
          `Para solucionarlo, debes agregar este dominio en tu Consola de Firebase -> Panel de Authentication -> pestaña 'Settings' o 'Ajustes' -> 'Authorized domains' o 'Dominios autorizados'.\n\n` +
          `👉 Copia y pega exactamente este dominio:\n${window.location.hostname}`;
      } else if (errMsg.includes("auth/popup-blocked") || errMsg.includes("popup-blocked")) {
        friendlyError = "El navegador bloqueó la ventana emergente de inicio de sesión con Google.\n\n" +
          "Por favor, haz clic en el icono de bloqueo de popups en tu barra de direcciones, permite las ventanas emergentes para esta página e inténtalo de nuevo.";
      } else if (errMsg.includes("auth/operation-not-allowed") || errMsg.includes("operation-not-allowed")) {
        friendlyError = "El inicio de sesión con Google no está habilitado en tu Firebase Authentication.\n\n" +
          "Habilítalo yendo a la consola de Firebase -> Build -> Authentication -> pestaña 'Método de inicio de sesión' -> 'Agregar nuevo proveedor' -> selecciona 'Google' y actívalo.";
      } else if (errMsg.includes("auth/internal-error")) {
        friendlyError = "Ocurrió un error interno al conectar con los servidores de autenticación de Google. Por favor, vuelve a intentarlo.";
      }

      setAuthError(friendlyError);
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
          <div className="flex items-center gap-2 w-full my-1">
            <div className="h-[2px] bg-gray-200 flex-1" />
            <span className="text-[10px] font-bold text-gray-400 font-mono uppercase">O también</span>
            <div className="h-[2px] bg-gray-200 flex-1" />
          </div>

          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoadingFirebase}
            className="w-full text-xs font-bold text-white flex items-center justify-center gap-2.5 bg-[#4285F4] hover:bg-[#357ae8] border-3 border-[#6E5A52] px-4 py-3 rounded-full shadow-[3px_3px_0px_0px_#6E5A52] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isLoadingFirebase ? "CONECTANDO..." : `Iniciar sesión oficial con Google (${selectedRole === 'student' ? 'Estudiante' : 'Docente'})`}</span>
          </button>

          {authError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full text-left bg-red-50 text-red-800 border-2 border-red-300 rounded-[16px] p-3.5 my-2 text-xs font-sans whitespace-pre-wrap leading-relaxed shadow-sm relative"
            >
              <div className="flex gap-2">
                <span className="text-sm">⚠️</span>
                <div className="flex-1">
                  <h4 className="font-extrabold text-[#984351] mb-1">Aviso de configuración:</h4>
                  <p className="font-mono text-[11px] select-all tracking-tight leading-normal whitespace-pre-line">{authError}</p>
                </div>
              </div>
            </motion.div>
          )}

          <button
            type="button"
            onClick={() => onLogin(selectedRole, selectedRole === "student" ? "Mateo Jiménez" : "Profra. Jenifer Maigual")}
            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 underline mt-2"
          >
            Usa acceso demo con usuario local temporal
          </button>

          <span className="text-[10px] text-gray-500 font-mono mt-2 block text-center">
            Versión 2.4.0 • Cumplimiento Ley 1581 (Habeas Data)
          </span>
        </div>
      </motion.div>
    </div>
  );
}

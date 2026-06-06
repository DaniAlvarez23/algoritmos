/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization function for Gemini API client to prevent startup failure
let geminiClient: any = null;
function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim().length > 0) {
      geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return geminiClient;
}

// REST route to evaluate student AST block sequences using AI or local rule-based fallback
app.post("/api/gemini/evaluate", async (req, res) => {
  const { blocks, coachMode } = req.body;

  if (!blocks || !Array.isArray(blocks)) {
    return res.status(400).json({ error: "Faltan bloques en la petición" });
  }

  const sequenceLabels = blocks.map((b: any) => b.type);
  const sequenceStr = sequenceLabels.join(" -> ");

  // Local rule-based fallback if Gemini API Key is not set or invalid
  const generateLocalResponse = (seq: string[]) => {
    let internalReasoning = {
      concept_to_teach: "Secuencias lineales e instrucciones de precondición.",
      analogy_selected: "Precalentar la leche en plato de barro.",
      didactic_strategy: "Andamiaje heurístico con humor boyacense."
    };

    let visibleResponse = "";
    let isCorrect = true;
    let errorType = null;

    if (seq.length === 0) {
      visibleResponse = "¡Hola, parce! Tu lienzo de código está vacío. Recuerda iniciar con el bloque 🏁 'Al empezar' para que sepamos por dónde arrancar.";
      isCorrect = false;
      errorType = "lienzo_vacio";
    } else if (seq[0] !== "al_empezar") {
      visibleResponse = "¡Caramba, mi llave! 🤠 Para que el robot sepa cuándo iniciar el desayuno, debes arrancar con el bloque 'Al empezar' 🏁 en la posición #1. ¡Ajústalo y volvemos a intentar!";
      isCorrect = false;
      errorType = "sin_inicio";
    } else if (!seq.includes("poner_olla")) {
      visibleResponse = "¡Qué calavera! 💀 Pusiste a cocinar cosas pero... ¡se te olvidó poner la olla en la estufa! 🍲 ¿Dónde vamos a hervir la leche, parce? Añade ese bloque después del inicio.";
      isCorrect = false;
      errorType = "sin_olla";
    } else if (seq.includes("esperar_hervir") && seq.indexOf("esperar_hervir") < seq.indexOf("poner_olla")) {
      visibleResponse = "¡Ave María! 🍳 Esperaste que hirviera la leche antes de colocar la olla en la estufa. ¡Ojo con el flujo de las cosas! Primero pones la olla con leche, luego esperas que caliente.";
      isCorrect = false;
      errorType = "orden_hervir_fallido";
    } else if (seq.includes("agregar_huevos") && !seq.includes("esperar_hervir")) {
      visibleResponse = "¡Ojo al charco! 🥚 Agregaste los huevos pero la leche no ha hervido. En Colombia, si echas el huevo en leche fría se nos deshace y queda baboso. ¡Primero pon a hervir la leche con sal!";
      isCorrect = false;
      errorType = "huevos_sin_hervir";
    } else if (seq.includes("agregar_huevos") && seq.indexOf("agregar_huevos") < seq.indexOf("esperar_hervir")) {
      visibleResponse = "¡Casi, mi llave! 🌿 Los huevos se echan justamente DESPUÉS de que la leche hierva con burbujas. Intenta mover el bloque 'Esperar a que hierva' ⏳ antes de 'Agregar huevos' 🥚.";
      isCorrect = false;
      errorType = "huevos_pre_hervir";
    } else if (!seq.includes("agregar_calado")) {
      visibleResponse = "¡Delicioso aroma! Leche hervida y huevos cocidos... pero falta el toque crujiente. ¡Agrégale calado (pan boyacense) 🍞 a esa changua antes de servir!";
      isCorrect = false;
      errorType = "falta_calado";
    } else {
      visibleResponse = "¡Ay caray, qué delicia! 🎉 Lograste armar la secuencia perfecta de la Changua Bogotana: Inicio 🏁 -> Olla en estufa 🍲 -> Hervir ⏳ -> Huevos 🥚 -> Calado 🍞. ¡Eres todo un maestro programador y chef!";
    }

    if (coachMode === "Technical") {
      visibleResponse = `[AST ANALYSER] ${isCorrect ? "COMPILATION SUCCESSFUL" : "FLOW COMPILATION ERROR"}: code=${errorType || "OK"}. sequence="${sequenceStr}". Sequence integrity checks passed=${isCorrect}. Advice: ensure FIFO logic.`;
    } else if (coachMode === "Silent") {
      visibleResponse = isCorrect ? "Ejecución correcta." : `Error: ${errorType}.`;
    }

    return {
      internal_reasoning: internalReasoning,
      student_visible_response: visibleResponse,
      scaffolding_evaluation: {
        is_correct_execution: isCorrect,
        error_type_detected: errorType,
        suggested_orchestrator_mode: isCorrect ? "Silent" : "Heuristic"
      }
    };
  };

  try {
    const client = getGeminiClient();
    if (!client) {
      // Key absent: serve offline premium rule processor
      const localRes = generateLocalResponse(sequenceLabels);
      return res.json(localRes);
    }

    // Key present: Query Gemini using googleGenAI sdk
    const systemPrompt = `
      Eres API, un robot pedagógico inteligente con sombrero vueltiao colombiano. Guías a un estudiante de Grado 6° (11-12 años) que está aprendiendo pensamiento algorítmico y secuenciación lógicas mediante recetas de cocina.
      
      El estudiante acaba de enviar este algoritmo para cocinar una 'Changua tradicional' (sopa de leche, sal, huevos, calado, cilantro):
      Enviado: "${sequenceStr}"

      La secuencia tradicional perfecta para un algoritmo ordenado es:
      1. al_empezar (Mapea a "Al empezar 🏁")
      2. poner_olla (Mapea a "Poner olla con leche en estufa 🍲")
      3. esperar_hervir (Mapea a "Esperar a que hierva ⏳")
      4. agregar_huevos (Mapea a "Agregar huevos 🥚")
      5. agregar_calado (Mapea a "Agregar calado (pan) 🍞")

      Evalúa la secuencia:
      - Si tiene errores de orden o falta algún paso, NO le des la respuesta perfecta. Dale pistas didácticas de andamiaje (scaffolding).
      - Incorpora sutilmente modismos y analogías locales de la región andina colombiana (como arepas, tinto, changua, tejo, ¡qué berraquera!, mi llave, parce, ¡ave maría!), siempre de manera divertida, respetuosa y adaptada para niños de 11 y 12 años.
      
      Modo de orientación docente actual: "${coachMode}".
      Si el modo es "Technical", usa un tono de programador de software con términos como "andamiaje AST", "fuegos hilos", "precondición lógica".
      Si el modo es "Silent", responde de manera muy corta e institucional.
      Si el modo es "Heuristic", usa el máximo humor boyacense y analogías divertidas.

      Debes retornar obligatoriamente un formato JSON con la siguiente estructura exacta:
      {
        "internal_reasoning": {
          "concept_to_teach": "string detallando qué concepto lógico falta",
          "analogy_selected": "string con la analogía boyacense/bogotana/andina aplicada",
          "didactic_strategy": "string explicando por qué se asiste de este modo"
        },
        "student_visible_response": "Tu respuesta motivadora en español de API el robot dirigida al estudiante de grado 6°",
        "scaffolding_evaluation": {
          "is_correct_execution": true o false según si la receta funcionaría sin asco ni quemaduras ni derrames,
          "error_type_detected": "código_del_error" o null,
          "suggested_orchestrator_mode": "Heuristic" o "Technical" o "Silent"
        }
      }
    `;

    const aiRes = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Genera la evaluación pedagógica correspondiente.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const parsedJson = JSON.parse(aiRes.text.trim());
    return res.json(parsedJson);

  } catch (err: any) {
    console.error("Gemini query error:", err);
    // Graceful error recovery: fall back to local rule-based response
    const localRes = generateLocalResponse(sequenceLabels);
    return res.json(localRes);
  }
});

// Configure Vite middleware in development or serve static files in production
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULLSTACK] Server booted successfully running on http://localhost:${PORT}`);
  });
}

setupServer();

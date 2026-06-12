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
  const { blocks, coachMode, levelId } = req.body;

  const currentLevel = Number(levelId) || 1;

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
      visibleResponse = "¡Caramba, mi llave! 🤠 Para que el robot sepa cuándo iniciar el proceso, debes arrancar con el bloque 'Al empezar' 🏁 en la posición #1. ¡Ajústalo y volvemos a intentar!";
      isCorrect = false;
      errorType = "sin_inicio";
    } else {
      // Evaluate based on challenge level
      if (currentLevel === 2) {
        // Arepa Boyacense Challenge
        internalReasoning = {
          concept_to_teach: "Bucle / Patrón repetitivo estructurado.",
          analogy_selected: "Amasar la arepa en la mesa de madera.",
          didactic_strategy: "Andamiaje didáctico para ciclos interactivos."
        };

        if (!seq.includes("verter_harina")) {
          visibleResponse = "¡Caray, parce! Pusiste a amasar pero... ¡se te olvidó echar la harina de maíz en el tazón! 🥣 ¿De dónde va a salir la arepa? Añade ese bloque.";
          isCorrect = false;
          errorType = "sin_harina";
        } else if (seq.includes("agregar_agua_sal") && seq.indexOf("agregar_agua_sal") < seq.indexOf("verter_harina")) {
          visibleResponse = "¡Ojo, mi llave! Primero echa la harina en el tazón 🥣, y luego le añades el agua con sal para que no se te haga un pegote en la mesa.";
          isCorrect = false;
          errorType = "agua_antes_harina";
        } else if (!seq.includes("repetir_amasar")) {
          visibleResponse = "¡Qué calavera! 💀 Pusiste la masa en la plancha directa... ¡pero no la amasaste! 🫓 Esa arepa te va a quedar dura como una teja boyacense. Agrégale el bucle de amasar.";
          isCorrect = false;
          errorType = "sin_amasar";
        } else if (seq.includes("asar_arepa") && seq.indexOf("asar_arepa") < seq.indexOf("repetir_amasar")) {
          visibleResponse = "¡Ave María, parce! Pusiste a asar la arepa en la plancha antes de amasarla. ¡Primero amasa bien 3 veces para que tenga suavidad y quesito!";
          isCorrect = false;
          errorType = "asar_antes_amasar";
        } else {
          visibleResponse = "¡Qué masa tan suave, mi llave! 🎉 Lograste amasar la arepa boyacense perfecta con queso y mantequilla. ¡Pura delicia de Tibasosa terminada!";
        }
      } else if (currentLevel === 3) {
        // Tejo / Conditional Challenge
        internalReasoning = {
          concept_to_teach: "Estructuras condicionales lógicas (si / if).",
          analogy_selected: "Golpear la mecha de pólvora en el tejo.",
          didactic_strategy: "Andamiaje Heurístico para ramificaciones lógicas."
        };

        if (!seq.includes("apuntar_cancha")) {
          visibleResponse = "¡Ojo al charco, mi llave! 🎯 Vas a lanzar el tejo sin apuntar a la cancha. ¡Puedes tumbarle el tinto al compadre! Primero apunta bien en la greda.";
          isCorrect = false;
          errorType = "sin_apuntar";
        } else if (seq.includes("lanzar_tejo") && seq.indexOf("lanzar_tejo") < seq.indexOf("apuntar_cancha")) {
          visibleResponse = "¡Qué berraquera! Lanzaste el tejo antes de apuntar. ¡Eso es tiro perdido, parce! Primero apunta y luego lanza con fuerza.";
          isCorrect = false;
          errorType = "lanzar_antes_apuntar";
        } else if (!seq.includes("si_golpea_mecha")) {
          visibleResponse = "¡Casi, parce! Lanzaste el tejo pero... ¿y si golpea la mecha con pólvora? 💥 Necesitas el bloque condicional 'Si el tejo golpea la mecha' para evaluar si hiciste Moñona.";
          isCorrect = false;
          errorType = "sin_condicion_mecha";
        } else if (seq.includes("celebrar_monona") && seq.indexOf("celebrar_monona") < seq.indexOf("si_golpea_mecha")) {
          visibleResponse = "¡Epa! Celebraste la moñona antes de comprobar si el tejo realmente golpeó la mecha. ¡Tranquilo, mi llave! Primero evalúa si hubo explosión.";
          isCorrect = false;
          errorType = "celebrar_antes_mecha";
        } else {
          visibleResponse = "¡PUMMMM! 💥 ¡Hiciste Moñona, parce! Sonó la pólvora, estalló la mecha y toda la tribuna te aplaude con un buen tinto caliente. ¡Excelente algoritmo condicional!";
        }
      } else {
        // Default: Changua Challenge
        if (!seq.includes("poner_olla")) {
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
      }
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
    let levelContext = "";
    if (currentLevel === 2) {
      levelContext = `
        El estudiante está resolviendo el 'Reto de la Arepa boyacense' (amasar y asar arepas).
        La secuencia ideal es:
        1. al_empezar (Mapea a "Al empezar 🏁")
        2. verter_harina (Mapea a "Verter harina de maíz 🥣")
        3. agregar_agua_sal (Mapea a "Agregar agua con sal 🧂")
        4. repetir_amasar (Mapea a "Repetir amasar 🔄")
        5. asar_arepa (Mapea a "Asar arepa en sartén 🫓")
      `;
    } else if (currentLevel === 3) {
      levelContext = `
        El estudiante está resolviendo el 'Reto del Tejo con Mecha' (lanzar tejo con lógica condicional).
        La secuencia ideal es:
        1. al_empezar (Mapea a "Al empezar 🏁")
        2. apuntar_cancha (Mapea a "Apuntar hacia la greda 🎯")
        3. lanzar_tejo (Mapea a "Lanzar tejo de metal 💪")
        4. si_golpea_mecha (Mapea a "Si el tejo golpea la mecha 💥")
        5. celebrar_monona (Mapea a "Celebrar moñona y saludar 🎉")
      `;
    } else {
      levelContext = `
        El estudiante está resolviendo el 'Reto de la Changua tradicional' (sopa de leche, sal, huevos, calado, cilantro).
        La secuencia ideal es:
        1. al_empezar (Mapea a "Al empezar 🏁")
        2. poner_olla (Mapea a "Poner olla con leche en estufa 🍲")
        3. esperar_hervir (Mapea a "Esperar a que hierva ⏳")
        4. agregar_huevos (Mapea a "Agregar huevos 🥚")
        5. agregar_calado (Mapea a "Agregar calado (pan) 🍞")
      `;
    }

    const systemPrompt = `
      Eres API, un robot pedagógico inteligente con sombrero vueltiao colombiano. Guías a un estudiante de Grado 6° (11-12 años) que está aprendiendo pensamiento algorítmico y secuenciación lógicas mediante recetas de cocina o retos divertidos colombianos.
      
      Desafío actual del estudiante:
      ${levelContext}

      Enviado: "${sequenceStr}"

      La secuencia tradicional perfecta se describe arriba para el algoritmo ordenado.

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

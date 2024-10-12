"use server";

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';



export async function getAnswer(text, emotion) {
  "use server";

  const genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_API_KEY || 'NO_API_KEY_PROVIDED',
  );

  // Esta categoría da falsos positivos todo el tiempo con comentarios en español de Uruguay
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    }
  ];

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002", safetySettings });

  const message = `Una persona te ha realizado un comentario: "${text}". Has detectado la siguiente emoción en su comentario: ${emotion}.
    
¡Debes responder algo! No será una conversación, así que no hagas preguntas ni pidas para que te cuente algo. Intenta hablar como un uruguayo y ser lo mas empático posible. Ten en cuenta la emoción detectada en el comentario anterior. IMPORTANTE: No usar palabras ofensivas ni agresivas.`;

  const result = await model.generateContent(message);
  return result.response.text()
}
import { GoogleGenAI, Content, Part, GenerateContentResponse } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION } from "../constants";
import { Role, Message, Attachment, GroundingSource } from "../types";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY not found");
      throw new Error("API Key is missing. Please check your environment variables.");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

// Convert internal Message format to Gemini Content format
const formatHistory = (messages: Message[]): Content[] => {
  return messages.map((msg) => {
    const parts: Part[] = [];
    
    // Add text part
    if (msg.text) {
      parts.push({ text: msg.text });
    }

    // Add image part if exists (only for user)
    if (msg.role === Role.USER && msg.attachment) {
      // Clean base64 string if it has prefix
      const base64Data = msg.attachment.data.split(',')[1] || msg.attachment.data;
      parts.push({
        inlineData: {
          mimeType: msg.attachment.mimeType,
          data: base64Data,
        },
      });
    }

    return {
      role: msg.role === Role.USER ? "user" : "model",
      parts: parts,
    };
  });
};

export const sendMessageToGemini = async (
  currentMessage: string,
  history: Message[],
  attachment?: Attachment,
  onChunk?: (text: string) => void
): Promise<{ text: string, groundingSources: GroundingSource[] }> => {
  try {
    const ai = getClient();
    const pastHistory = formatHistory(history);

    // Use Gemini 3.0 Pro with Google Search
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: pastHistory,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4, 
        maxOutputTokens: 4000,
        tools: [{ googleSearch: {} }] // Enable Grounding
      },
    });

    const parts: Part[] = [];
    if (attachment) {
       const base64Data = attachment.data.split(',')[1] || attachment.data;
       parts.push({
         inlineData: {
           mimeType: attachment.mimeType,
           data: base64Data
         }
       });
    }
    parts.push({ text: currentMessage });

    const streamResult = await chat.sendMessageStream({ 
        message: parts
    });

    let fullText = "";
    let groundingSources: GroundingSource[] = [];

    for await (const chunk of streamResult) {
      const c = chunk as GenerateContentResponse;
      const chunkText = c.text;
      
      // Capture grounding metadata
      const chunks = c.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
           if (chunk.web?.uri && chunk.web?.title) {
             groundingSources.push({
               title: chunk.web.title,
               uri: chunk.web.uri
             });
           }
        });
      }

      if (chunkText) {
        fullText += chunkText;
        if (onChunk) {
          onChunk(chunkText);
        }
      }
    }

    // Deduplicate sources
    const uniqueSources = groundingSources.filter((v,i,a)=>a.findIndex(v2=>(v2.uri===v.uri))===i);

    return { text: fullText, groundingSources: uniqueSources };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};
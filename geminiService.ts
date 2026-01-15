
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateAppBlueprint(prompt: string, onUpdate?: (chunk: string) => void): Promise<string> {
    const ai = this.getAI();
    // Using Gemini 3 Pro for complex architectural tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Design a full software architecture for: ${prompt}. 
      Include project structure, key components, and the main App.tsx code. 
      Format the output clearly with file paths in markers like [FILE: path/to/file.tsx].`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 16000 }
      },
    });

    return response.text || '';
  }

  async debugCode(code: string, error: string): Promise<string> {
    const ai = this.getAI();
    const prompt = `I encountered this error in my React/TS code: ${error}\n\nCode context:\n${code}\n\nPlease provide only the corrected code block.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert debugger. Provide minimal, high-impact fixes.",
        temperature: 0.2,
      },
    });

    return response.text || '';
  }
}

export const gemini = new GeminiService();

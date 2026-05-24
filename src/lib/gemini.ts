import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY || "dummy_key_for_build"
const genAI = new GoogleGenerativeAI(apiKey)

export const flashModel = genAI.getGenerativeModel({ 
  model: "gemini-3.5-flash"
})

export const proModel = genAI.getGenerativeModel({ 
  model: "gemini-3.1-pro"
})

export function stripJsonMarkdown(text: string): string {
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { flashModel, stripJsonMarkdown } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, description, techStack } = await req.json()
    if (!title) {
      return NextResponse.json({ error: "Missing project title" }, { status: 400 })
    }

    const prompt = `Generate 3 concise resume bullet points for this project.
Project: ${title}
Description: ${description || "N/A"}
Tech: ${techStack?.join(", ") || "N/A"}
Rules: start each with a strong action verb, quantify impact where possible, keep each under 20 words.
Return ONLY a JSON array of 3 strings: ["...", "...", "..."]`

    let jsonResponse;
    try {
      const result = await flashModel.generateContent(prompt)
      const text = result.response.text()
      const cleanText = stripJsonMarkdown(text)
      jsonResponse = JSON.parse(cleanText)
    } catch (parseError) {
      // Retry once
      const retryPrompt = `You are a strict JSON formatter. Generate 3 resume bullets for project ${title}. Return EXACTLY a JSON array of strings: ["bullet1", "bullet2", "bullet3"]. NO markdown.`
      const retryResult = await flashModel.generateContent(retryPrompt)
      const retryText = retryResult.response.text()
      const cleanRetryText = stripJsonMarkdown(retryText)
      jsonResponse = JSON.parse(cleanRetryText)
    }

    if (!Array.isArray(jsonResponse) || jsonResponse.length === 0) {
      throw new Error("Invalid format from AI")
    }

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("AI Highlights Error:", error)
    return NextResponse.json({ error: "AI response was malformed, please try again" }, { status: 500 })
  }
}

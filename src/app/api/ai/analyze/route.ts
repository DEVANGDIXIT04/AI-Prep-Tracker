import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { flashModel, stripJsonMarkdown } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { stats } = await req.json()
    if (!stats || !Array.isArray(stats)) {
      return NextResponse.json({ error: "Missing or invalid stats array" }, { status: 400 })
    }

    const prompt = `You are a DSA coach. Analyze these topic stats: 
${JSON.stringify(stats, null, 2)}

Identify the 3 weakest topics based on solve rate and revisit count.
Return ONLY JSON, no markdown:
[{ 
  "topic": "string",
  "weaknessReason": "string",
  "sevenDayPlan": [{"day": 1, "task": "string"}]
}]`

    let jsonResponse;
    try {
      const result = await flashModel.generateContent(prompt)
      const text = result.response.text()
      const cleanText = stripJsonMarkdown(text)
      jsonResponse = JSON.parse(cleanText)
    } catch (parseError) {
      // Retry once
      const retryPrompt = `You are a strict JSON formatter. Analyze the stats: ${JSON.stringify(stats)}. Return EXACTLY a JSON array of 3 objects with keys 'topic', 'weaknessReason', and 'sevenDayPlan' (array of {day, task}). NO markdown backticks.`
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
    console.error("AI Analyze Error:", error)
    return NextResponse.json({ error: "AI response was malformed, please try again" }, { status: 500 })
  }
}

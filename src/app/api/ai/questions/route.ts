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
    const { topic, difficulty, type } = await req.json()
    if (!topic || !difficulty || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const prompt = `You are a senior FAANG technical interviewer.
Generate exactly 5 ${type} interview questions on ${topic} at ${difficulty} level.
Return ONLY a JSON array, no markdown, no explanation:
[{ "question": "...", "hint": "..." }]`

    let jsonResponse;
    try {
      const result = await flashModel.generateContent(prompt)
      const text = result.response.text()
      const cleanText = stripJsonMarkdown(text)
      jsonResponse = JSON.parse(cleanText)
    } catch (parseError) {
      // Retry once on failure
      const retryPrompt = `You are a strict data formatter. Return EXACTLY a valid JSON array of 5 questions on ${topic} (${difficulty}). Format: [{"question": "Q", "hint": "H"}]. NO markdown backticks.`
      const retryResult = await flashModel.generateContent(retryPrompt)
      const retryText = retryResult.response.text()
      const cleanRetryText = stripJsonMarkdown(retryText)
      jsonResponse = JSON.parse(cleanRetryText)
    }

    if (!Array.isArray(jsonResponse) || jsonResponse.length === 0) {
      throw new Error("Invalid format from AI")
    }

    // Save to DB
    const savedQuestions = []
    for (const q of jsonResponse) {
      const saved = await prisma.questionBank.create({
        data: {
          question: q.question,
          hint: q.hint || "",
          topic,
          difficulty,
          userId: session.user.id
        }
      })
      savedQuestions.push(saved)
    }

    return NextResponse.json(savedQuestions, { status: 201 })
  } catch (error) {
    console.error("AI Question Error:", error)
    return NextResponse.json({ error: "AI response was malformed, please try again" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const questions = await prisma.questionBank.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(questions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

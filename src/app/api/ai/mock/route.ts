import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { proModel } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    const { history } = await req.json()
    if (!history || !Array.isArray(history)) {
      return new Response(JSON.stringify({ error: "Missing conversation history" }), { status: 400 })
    }

    const systemPrompt = `You are a strict but fair technical interviewer at a top tech company.
Rules:
1. Start by asking ONE DSA coding question (medium difficulty).
2. When the user responds, evaluate their approach clearly.
3. Give a hint ONLY if the user explicitly asks for one.
4. After 3 user responses, give a final score out of 10 with specific feedback on: approach, correctness, complexity analysis.
5. Keep responses concise and professional.`

    // Format history for Gemini
    // Gemini history format: { role: 'user' | 'model', parts: [{ text: '' }] }
    // We inject system prompt into the first message
    const formattedHistory = history.map((msg: any, index: number) => {
      let text = msg.content
      if (index === 0 && msg.role === 'user') {
        text = `[SYSTEM PROMPT: ${systemPrompt}]\n\nUser: ${text}`
      }
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text }]
      }
    })

    // Pop the last message to send as the new prompt
    const latestMessage = formattedHistory.pop()
    if (!latestMessage) {
      return new Response(JSON.stringify({ error: "Empty history" }), { status: 400 })
    }

    const chat = proModel.startChat({
      history: formattedHistory,
    })

    const result = await chat.sendMessageStream(latestMessage.parts[0].text)

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            if (chunkText) {
              controller.enqueue(new TextEncoder().encode(chunkText))
            }
          }
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      }
    })
  } catch (error) {
    console.error("Mock Interview Stream Error:", error)
    return new Response(JSON.stringify({ error: "Failed to generate response" }), { status: 500 })
  }
}

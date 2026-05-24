import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { transcript, score } = await req.json()
    
    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json({ error: "Missing or invalid transcript" }, { status: 400 })
    }

    const savedSession = await prisma.mockSession.create({
      data: {
        transcript: transcript,
        score: score ? parseInt(score) : null,
        userId: session.user.id
      }
    })

    return NextResponse.json(savedSession, { status: 201 })
  } catch (error) {
    console.error("Mock Session Save Error:", error)
    return NextResponse.json({ error: "Failed to save mock session" }, { status: 500 })
  }
}

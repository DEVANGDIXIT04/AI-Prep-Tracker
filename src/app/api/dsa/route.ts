import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { upsertStreak } from "@/lib/streak"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const difficulty = searchParams.get("difficulty")
  const status = searchParams.get("status")

  const where: any = { userId: session.user.id }
  if (difficulty) where.difficulty = difficulty
  if (status) where.status = status

  try {
    const problems = await prisma.dSAProblem.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(problems)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch problems" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { title, difficulty, topic, status, notes, solvedAt } = data

    const problem = await prisma.dSAProblem.create({
      data: {
        title,
        difficulty,
        topic,
        status: status || "TODO",
        notes,
        solvedAt: solvedAt ? new Date(solvedAt) : null,
        userId: session.user.id,
      },
    })
    
    await upsertStreak(session.user.id)
    
    return NextResponse.json(problem, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create problem" }, { status: 500 })
  }
}

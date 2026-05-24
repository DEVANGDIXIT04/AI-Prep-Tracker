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
  const platform = searchParams.get("platform")

  const where: any = { userId: session.user.id }
  if (platform && platform !== "ALL") {
    where.platform = platform
  }

  try {
    const contests = await prisma.contest.findMany({
      where,
      orderBy: { date: "desc" },
    })
    return NextResponse.json(contests)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { platform, contestName, date, rank, totalParticipants, problemsSolved, ratingChange } = data

    const contest = await prisma.contest.create({
      data: {
        platform,
        contestName,
        date: new Date(date),
        rank: rank ? parseInt(rank) : null,
        totalParticipants: totalParticipants ? parseInt(totalParticipants) : null,
        problemsSolved: problemsSolved ? parseInt(problemsSolved) : null,
        ratingChange: ratingChange ? parseInt(ratingChange) : null,
        userId: session.user.id,
      },
    })
    
    await upsertStreak(session.user.id)
    
    return NextResponse.json(contest, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to log contest" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const existing = await prisma.contest.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    const { platform, contestName, date, rank, totalParticipants, problemsSolved, ratingChange } = data

    const contest = await prisma.contest.update({
      where: { id: params.id },
      data: {
        ...(platform && { platform }),
        ...(contestName && { contestName }),
        ...(date && { date: new Date(date) }),
        ...(rank !== undefined && { rank: rank ? parseInt(rank) : null }),
        ...(totalParticipants !== undefined && { totalParticipants: totalParticipants ? parseInt(totalParticipants) : null }),
        ...(problemsSolved !== undefined && { problemsSolved: problemsSolved ? parseInt(problemsSolved) : null }),
        ...(ratingChange !== undefined && { ratingChange: ratingChange ? parseInt(ratingChange) : null }),
      },
    })
    return NextResponse.json(contest)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update contest" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const existing = await prisma.contest.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    await prisma.contest.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete contest" }, { status: 500 })
  }
}

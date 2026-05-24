import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { upsertStreak } from "@/lib/streak"

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
    // Verify ownership
    const existing = await prisma.dSAProblem.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    const { title, difficulty, topic, status, notes, solvedAt } = data

    const problem = await prisma.dSAProblem.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(difficulty && { difficulty }),
        ...(topic && { topic }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(solvedAt !== undefined && { solvedAt: solvedAt ? new Date(solvedAt) : null }),
      },
    })
    
    await upsertStreak(session.user.id)
    
    return NextResponse.json(problem)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update problem" }, { status: 500 })
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
    // Verify ownership
    const existing = await prisma.dSAProblem.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    await prisma.dSAProblem.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete problem" }, { status: 500 })
  }
}

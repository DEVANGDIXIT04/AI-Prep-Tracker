import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { isCompleted } = await req.json()
    const weekId = params.id

    // Verify ownership indirectly by joining roadmap
    const week = await prisma.roadmapWeek.findUnique({
      where: { id: weekId },
      include: { roadmap: true }
    })

    if (!week || week.roadmap.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    const updatedWeek = await prisma.roadmapWeek.update({
      where: { id: weekId },
      data: { isCompleted }
    })

    return NextResponse.json(updatedWeek)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update week status" }, { status: 500 })
  }
}

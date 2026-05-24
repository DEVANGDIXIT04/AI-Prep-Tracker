import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { del } from "@vercel/blob"

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
    const existing = await prisma.resume.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    const { isActive, notes, label } = data

    // If setting to active, deactivate all others first
    if (isActive) {
      await prisma.resume.updateMany({
        where: { userId: session.user.id, isActive: true },
        data: { isActive: false },
      })
    }

    const resume = await prisma.resume.update({
      where: { id: params.id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(notes !== undefined && { notes }),
        ...(label !== undefined && { label }),
      },
    })
    return NextResponse.json(resume)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update resume" }, { status: 500 })
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
    const existing = await prisma.resume.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    // Delete from blob
    if (existing.fileUrl) {
      await del(existing.fileUrl).catch(e => console.error("Blob delete error", e))
    }

    // Delete from DB
    await prisma.resume.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 })
  }
}

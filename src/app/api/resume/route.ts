import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(resumes)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const version = formData.get("version") as string
    const label = formData.get("label") as string
    const notes = formData.get("notes") as string
    
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, { access: "public" })

    // Save to DB
    const resume = await prisma.resume.create({
      data: {
        version: version || "1.0",
        label,
        fileUrl: blob.url,
        notes,
        userId: session.user.id,
      },
    })
    
    return NextResponse.json(resume, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to upload resume" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { subDays } from "date-fns"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const sevenDaysAgo = subDays(new Date(), 7)

  try {
    const problems = await prisma.dSAProblem.findMany({
      where: {
        userId,
        status: "DONE",
        solvedAt: { lt: sevenDaysAgo }
      },
      orderBy: { solvedAt: "asc" },
      take: 5
    })
    return NextResponse.json(problems)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch review problems" }, { status: 500 })
  }
}

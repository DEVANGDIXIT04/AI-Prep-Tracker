import { prisma } from "@/lib/prisma"

export async function upsertStreak(userId: string) {
  // Get today's date at midnight UTC
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  try {
    await prisma.streak.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {},
      create: {
        userId,
        date: today,
      },
    })
  } catch (error) {
    console.error("Failed to upsert streak:", error)
  }
}

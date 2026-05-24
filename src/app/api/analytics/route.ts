import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { subDays, subMonths, startOfWeek, format, eachWeekOfInterval, subWeeks, subMonths as dateFnsSubMonths } from "date-fns"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const range = searchParams.get("range") || "30d"
  
  let dateFilter = new Date(0) // all time
  if (range === "7d") dateFilter = subDays(new Date(), 7)
  else if (range === "30d") dateFilter = subDays(new Date(), 30)
  else if (range === "3m") dateFilter = subMonths(new Date(), 3)

  const userId = session.user.id

  try {
    // 1. Bar Chart: DSA Problems solved per week (Last 8 weeks)
    const eightWeeksAgo = subWeeks(new Date(), 8)
    const recentSolved = await prisma.dSAProblem.findMany({
      where: {
        userId,
        solvedAt: { gte: eightWeeksAgo }
      },
      select: { solvedAt: true }
    })

    // Initialize all 8 weeks with 0
    const weeksInterval = eachWeekOfInterval({ start: eightWeeksAgo, end: new Date() })
    const solvedPerWeekMap = new Map()
    weeksInterval.forEach(weekStart => {
      solvedPerWeekMap.set(format(weekStart, "MMM dd"), 0)
    })

    recentSolved.forEach(p => {
      if (!p.solvedAt) return
      const weekStart = startOfWeek(p.solvedAt)
      const key = format(weekStart, "MMM dd")
      if (solvedPerWeekMap.has(key)) {
        solvedPerWeekMap.set(key, solvedPerWeekMap.get(key) + 1)
      }
    })
    
    const solvedPerWeek = Array.from(solvedPerWeekMap.entries()).map(([name, solves]) => ({ name, solves }))

    // 2. Pie Chart: Topic Distribution (Using date filter)
    const topicGroup = await prisma.dSAProblem.groupBy({
      by: ['topic'],
      where: { userId, solvedAt: { gte: dateFilter } },
      _count: { topic: true }
    })
    const topicDistribution = topicGroup.map(t => ({
      name: t.topic,
      value: t._count.topic
    }))

    // 3. Line Chart: Contest Rating Over Time
    const contests = await prisma.contest.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      select: { platform: true, date: true, ratingChange: true }
    })

    // We'll calculate cumulative rating assuming starting rating is 1500 for simplicity,
    // or just plot rating changes cumulatively.
    const contestRatings: any[] = []
    const currentRatings: Record<string, number> = {
      LEETCODE: 1500,
      CODEFORCES: 1500,
      CODECHEF: 1500,
      OTHER: 1500
    }

    contests.forEach(c => {
      if (c.ratingChange !== null && c.ratingChange !== undefined) {
        currentRatings[c.platform] += c.ratingChange
        contestRatings.push({
          date: format(c.date, "MMM dd"),
          [c.platform]: currentRatings[c.platform]
        })
      }
    })

    // 4. Custom Heatmap: Daily activity for last 6 months
    const sixMonthsAgo = dateFnsSubMonths(new Date(), 6)
    const streaks = await prisma.streak.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      select: { date: true }
    })
    
    const dailyActivity = streaks.map(s => ({
      date: format(s.date, "yyyy-MM-dd"),
      count: 1 // Since streak is 1 per day. We could make this intensity based on multiple problems later.
    }))

    // 5. Radar Chart: Weak Topics
    // Calculate percentage based on target 50 problems per topic
    const TARGET_PER_TOPIC = 50
    const allTopicGroup = await prisma.dSAProblem.groupBy({
      by: ['topic'],
      where: { userId, status: "DONE" },
      _count: { topic: true }
    })
    
    const radarData = allTopicGroup.map(t => ({
      topic: t.topic.substring(0, 8), // shorten name for radar chart
      fullTopic: t.topic,
      score: Math.min(Math.round((t._count.topic / TARGET_PER_TOPIC) * 100), 100)
    }))

    return NextResponse.json({
      solvedPerWeek,
      topicDistribution,
      contestRatings,
      dailyActivity,
      radarData
    })
  } catch (error) {
    console.error("Analytics Error", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

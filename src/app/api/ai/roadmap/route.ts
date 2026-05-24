import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { proModel, stripJsonMarkdown } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { targetCompany, targetRole, monthsLeft, dsaLevel, systemDesignLevel } = await req.json()
    
    if (!targetCompany || !targetRole || !monthsLeft) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const prompt = `You are a placement coach for top tech companies.
Create a week-by-week preparation roadmap for:
Company: ${targetCompany}, Role: ${targetRole}
Time available: ${monthsLeft} months (which is ${Math.round(monthsLeft * 4)} weeks)
Current DSA skill: ${dsaLevel}/5
Current System Design skill: ${systemDesignLevel}/5

Return ONLY JSON, no markdown:
{
  "overview": "string",
  "weeks": [{
    "weekNumber": number,
    "theme": "string",
    "dsaTopics": ["string"],
    "problemCount": number,
    "systemDesignTopic": "string",
    "milestone": "string"
  }]
}`

    let jsonResponse;
    try {
      const result = await proModel.generateContent(prompt)
      const text = result.response.text()
      const cleanText = stripJsonMarkdown(text)
      jsonResponse = JSON.parse(cleanText)
    } catch (parseError) {
      // Retry once
      const retryPrompt = `You are a strict JSON formatter. Generate a ${Math.round(monthsLeft * 4)} week roadmap for ${targetCompany} ${targetRole}. Return EXACTLY a JSON object with 'overview' and 'weeks' array. NO markdown backticks.`
      const retryResult = await proModel.generateContent(retryPrompt)
      const retryText = retryResult.response.text()
      const cleanRetryText = stripJsonMarkdown(retryText)
      jsonResponse = JSON.parse(cleanRetryText)
    }

    if (!jsonResponse.weeks || !Array.isArray(jsonResponse.weeks)) {
      throw new Error("Invalid format from AI")
    }

    // Save to DB
    const savedRoadmap = await prisma.roadmap.create({
      data: {
        company: targetCompany,
        role: targetRole,
        overview: jsonResponse.overview,
        userId: session.user.id,
        weeks: {
          create: jsonResponse.weeks.map((w: any) => ({
            weekNumber: w.weekNumber,
            theme: w.theme || "General Prep",
            dsaTopics: w.dsaTopics || [],
            problemCount: w.problemCount || 10,
            systemDesignTopic: w.systemDesignTopic || "None",
            milestone: w.milestone || ""
          }))
        }
      },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" }
        }
      }
    })

    return NextResponse.json(savedRoadmap, { status: 201 })
  } catch (error) {
    console.error("AI Roadmap Error:", error)
    return NextResponse.json({ error: "AI response was malformed, please try again" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: session.user.id },
      include: { weeks: { orderBy: { weekNumber: "asc" } } },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(roadmaps)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch roadmaps" }, { status: 500 })
  }
}

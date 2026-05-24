"use client"

import { useState, useEffect } from "react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export function DashboardWidgets() {
  const [radarData, setRadarData] = useState<any[]>([])
  const [reviewProblems, setReviewProblems] = useState<any[]>([])
  const [loadingRadar, setLoadingRadar] = useState(true)
  const [loadingReview, setLoadingReview] = useState(true)

  useEffect(() => {
    // Fetch Radar Data
    fetch("/api/analytics?range=all")
      .then(res => res.json())
      .then(data => {
        setRadarData(data.radarData || [])
        setLoadingRadar(false)
      })
      .catch(() => setLoadingRadar(false))

    // Fetch Review Data
    fetch("/api/dsa/review")
      .then(res => res.json())
      .then(data => {
        setReviewProblems(data || [])
        setLoadingReview(false)
      })
      .catch(() => setLoadingReview(false))
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Weak Topics Analysis</CardTitle>
          <CardDescription>Based on completed vs target ratio.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {loadingRadar ? (
            <Skeleton className="w-full h-full rounded-full" />
          ) : radarData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Not enough data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid strokeOpacity={0.5} />
                <PolarAngleAxis dataKey="topic" fontSize={12} tick={{ fill: 'var(--muted-foreground)' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Completion %" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value}%`, "Completion"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Due for Review</CardTitle>
          <CardDescription>Problems solved over 7 days ago.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingReview ? (
            <div className="space-y-4">
              <Skeleton className="w-full h-12 rounded-lg" />
              <Skeleton className="w-full h-12 rounded-lg" />
              <Skeleton className="w-full h-12 rounded-lg" />
            </div>
          ) : reviewProblems.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
              You are all caught up!
            </div>
          ) : (
            <div className="space-y-4">
              {reviewProblems.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg bg-muted/20">
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Solved: {new Date(p.solvedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={p.difficulty === 'EASY' ? 'secondary' : p.difficulty === 'MEDIUM' ? 'default' : 'destructive'}>
                      {p.difficulty}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

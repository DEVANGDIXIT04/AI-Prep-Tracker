"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Bot, Loader2, PlayCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

// Define colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57']
const LINE_COLORS: Record<string, string> = {
  LEETCODE: '#FFBB28',
  CODEFORCES: '#0088FE',
  CODECHEF: '#00C49F',
  OTHER: '#8884d8'
}

type AnalyticsData = {
  solvedPerWeek: { name: string; solves: number }[]
  topicDistribution: { name: string; value: number }[]
  contestRatings: { date: string; [key: string]: number | string }[]
  dailyActivity: { date: string; count: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30d")
  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any[] | null>(null)
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/analytics?range=${dateRange}`)
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error("Failed to fetch analytics", error)
      }
      setLoading(false)
    }

    fetchData()
  }, [dateRange])

  const handleAnalyze = async () => {
    if (!data?.radarData) return
    setAnalyzing(true)
    
    // Convert radar data into simple stats payload
    const stats = data.radarData.map(d => ({
      topic: d.fullTopic,
      score: d.score,
      completedOrAttempted: "Calculated relative to target"
    }))

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats })
      })

      if (!res.ok) throw new Error("Analysis failed")
      const result = await res.json()
      setAiAnalysis(result)
      toast.success("Analysis complete!")
    } catch (error: any) {
      toast.error(error.message)
    }
    setAnalyzing(false)
  }

  // Custom Heatmap Component
  const renderHeatmap = () => {
    if (!data?.dailyActivity) return null

    // Generate last 180 days (approx 6 months)
    const days = []
    for (let i = 179; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().split("T")[0])
    }

    const activityMap = new Map(data.dailyActivity.map(a => [a.date, a.count]))

    return (
      <div className="flex overflow-x-auto pb-2 custom-scrollbar">
        <div className="grid grid-rows-7 gap-1 grid-flow-col">
          {days.map((day, idx) => {
            const count = activityMap.get(day) || 0
            let bgColor = "bg-muted" // 0
            if (count === 1) bgColor = "bg-green-200 dark:bg-green-900/40"
            else if (count === 2) bgColor = "bg-green-400 dark:bg-green-700/60"
            else if (count >= 3) bgColor = "bg-green-600 dark:bg-green-500"

            return (
              <div
                key={day}
                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${bgColor} hover:ring-2 ring-primary transition-all`}
                title={`${day}: ${count} activity`}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">Visualize your progress and consistency.</p>
        </div>
        <div className="w-40">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AI Analysis Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" /> Weak Topic Analyzer
              </CardTitle>
              <CardDescription>Get an AI-generated 7-day practice plan for your weakest topics.</CardDescription>
            </div>
            <Button onClick={handleAnalyze} disabled={analyzing || loading}>
              {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Analyze Data"}
            </Button>
          </div>
        </CardHeader>
        {aiAnalysis && (
          <CardContent>
            <div className="space-y-4">
              {aiAnalysis.map((item, i) => (
                <div key={i} className="border rounded-md bg-card">
                  <button 
                    className="w-full px-4 py-3 flex justify-between items-center font-medium hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedTopic(expandedTopic === item.topic ? null : item.topic)}
                  >
                    <span>{item.topic}</span>
                    {expandedTopic === item.topic ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {expandedTopic === item.topic && (
                    <div className="p-4 pt-0 border-t mt-2">
                      <p className="text-sm text-muted-foreground mb-4">{item.weaknessReason}</p>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">7-Day Plan</h5>
                      <ul className="space-y-2 mb-4">
                        {item.sevenDayPlan.map((plan: any) => (
                          <li key={plan.day} className="text-sm flex gap-2">
                            <span className="font-medium text-primary shrink-0">Day {plan.day}:</span>
                            <span>{plan.task}</span>
                          </li>
                        ))}
                      </ul>
                      <Button size="sm" variant="secondary" onClick={() => router.push(`/questions`)}>
                        <PlayCircle className="w-4 h-4 mr-2" /> Practice This Topic
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Heatmap Section */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Map (Last 6 Months)</CardTitle>
          <CardDescription>Your daily streak and consistency.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="w-full h-[120px] rounded-lg" />
          ) : (
            renderHeatmap()
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle>Problems Solved per Week</CardTitle>
            <CardDescription>Last 8 weeks of activity.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="w-full h-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.solvedPerWeek}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{fill: 'var(--muted)'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="solves" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle>Topic Distribution</CardTitle>
            <CardDescription>Based on selected date filter.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {loading ? (
              <Skeleton className="w-64 h-64 rounded-full" />
            ) : data?.topicDistribution.length === 0 ? (
              <div className="text-muted-foreground text-sm">No problems solved in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.topicDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data?.topicDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Line Chart Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contest Rating Trajectory</CardTitle>
            <CardDescription>Accumulated rating changes over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loading ? (
              <Skeleton className="w-full h-full rounded-lg" />
            ) : data?.contestRatings.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No contest logs found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.contestRatings}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="LEETCODE" stroke={LINE_COLORS.LEETCODE} strokeWidth={3} dot={{ r: 4 }} connectNulls />
                  <Line type="monotone" dataKey="CODEFORCES" stroke={LINE_COLORS.CODEFORCES} strokeWidth={3} dot={{ r: 4 }} connectNulls />
                  <Line type="monotone" dataKey="CODECHEF" stroke={LINE_COLORS.CODECHEF} strokeWidth={3} dot={{ r: 4 }} connectNulls />
                  <Line type="monotone" dataKey="OTHER" stroke={LINE_COLORS.OTHER} strokeWidth={3} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

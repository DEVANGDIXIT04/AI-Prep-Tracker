"use client"

import { useState, useEffect } from "react"
import { Bot, Loader2, CheckCircle2, Circle, Map, Briefcase, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import toast from "react-hot-toast"

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  const [targetCompany, setTargetCompany] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [monthsLeft, setMonthsLeft] = useState("3")
  const [dsaLevel, setDsaLevel] = useState("3")
  const [systemDesignLevel, setSystemDesignLevel] = useState("2")

  useEffect(() => {
    fetchRoadmaps()
  }, [])

  const fetchRoadmaps = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/roadmap")
      const data = await res.json()
      setRoadmaps(data)
    } catch (error) {
      toast.error("Failed to load roadmaps")
    }
    setLoading(false)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)

    try {
      const res = await fetch("/api/ai/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCompany,
          targetRole,
          monthsLeft: parseInt(monthsLeft),
          dsaLevel: parseInt(dsaLevel),
          systemDesignLevel: parseInt(systemDesignLevel)
        })
      })

      if (!res.ok) throw new Error("AI response was malformed, please try again")

      const newRoadmap = await res.json()
      setRoadmaps(prev => [newRoadmap, ...prev])
      toast.success("Roadmap generated successfully!")
    } catch (error: any) {
      toast.error(error.message)
    }

    setGenerating(false)
  }

  const toggleWeekCompletion = async (weekId: string, currentStatus: boolean, roadmapIndex: number, weekIndex: number) => {
    // Optimistic UI update
    const newRoadmaps = [...roadmaps]
    newRoadmaps[roadmapIndex].weeks[weekIndex].isCompleted = !currentStatus
    setRoadmaps(newRoadmaps)

    try {
      const res = await fetch(`/api/roadmap/week/${weekId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentStatus })
      })
      if (!res.ok) throw new Error()
    } catch (error) {
      // Revert on failure
      const revertedRoadmaps = [...roadmaps]
      revertedRoadmaps[roadmapIndex].weeks[weekIndex].isCompleted = currentStatus
      setRoadmaps(revertedRoadmaps)
      toast.error("Failed to update status")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Prep Roadmap</h2>
        <p className="text-muted-foreground">Generate a custom week-by-week preparation plan.</p>
      </div>

      <Card className="bg-muted/30 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" /> Create New Roadmap
          </CardTitle>
          <CardDescription>Tailor your plan based on your target company and timeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label>Target Company</Label>
              <Input placeholder="e.g. Google, Stripe" value={targetCompany} onChange={e => setTargetCompany(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Target Role</Label>
              <Input placeholder="e.g. SDE II, Frontend" value={targetRole} onChange={e => setTargetRole(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Time (Months)</Label>
              <Select value={monthsLeft} onValueChange={setMonthsLeft}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="2">2 Months</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current DSA Skill (1-5)</Label>
              <Select value={dsaLevel} onValueChange={setDsaLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(v => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={generating || !targetCompany || !targetRole} className="w-full">
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Plan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading roadmaps...</div>
        ) : roadmaps.length === 0 ? (
          <div className="text-center py-20 border border-dashed rounded-lg text-muted-foreground">
            No roadmaps generated yet.
          </div>
        ) : (
          roadmaps.map((roadmap, rIdx) => (
            <Card key={roadmap.id} className="overflow-hidden">
              <div className="bg-primary/5 p-6 border-b">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" /> {roadmap.company}
                    </h3>
                    <p className="text-lg text-muted-foreground flex items-center gap-2 mt-1">
                      <GraduationCap className="w-5 h-5" /> {roadmap.role}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-sm py-1">
                    {roadmap.weeks.length} Weeks
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed">{roadmap.overview}</p>
              </div>
              
              <CardContent className="p-0">
                <div className="relative border-l-2 border-muted ml-8 my-8 space-y-8">
                  {roadmap.weeks.map((week: any, wIdx: number) => (
                    <div key={week.id} className="relative pl-6 pr-6">
                      <button 
                        onClick={() => toggleWeekCompletion(week.id, week.isCompleted, rIdx, wIdx)}
                        className="absolute -left-[17px] top-1 bg-background rounded-full hover:scale-110 transition-transform"
                      >
                        {week.isCompleted ? (
                          <CheckCircle2 className="w-8 h-8 text-primary bg-background" />
                        ) : (
                          <Circle className="w-8 h-8 text-muted-foreground bg-background" />
                        )}
                      </button>
                      
                      <div className={`border rounded-lg p-5 transition-colors ${week.isCompleted ? 'bg-muted/30 opacity-75' : 'bg-card shadow-sm'}`}>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-lg">Week {week.weekNumber}: {week.theme}</h4>
                          {week.isCompleted && <Badge className="bg-primary">Completed</Badge>}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-semibold text-muted-foreground block mb-1">DSA Focus ({week.problemCount} problems)</span>
                            <div className="flex flex-wrap gap-2">
                              {week.dsaTopics.map((t: string, i: number) => (
                                <Badge key={i} variant="secondary">{t}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="font-semibold text-muted-foreground block mb-1">System Design Focus</span>
                            <p>{week.systemDesignTopic}</p>
                          </div>
                        </div>
                        
                        {week.milestone && (
                          <div className="mt-4 pt-3 border-t text-sm">
                            <span className="font-semibold">Milestone:</span> {week.milestone}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

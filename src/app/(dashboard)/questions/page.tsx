"use client"

import { useState, useEffect } from "react"
import { Bot, Lightbulb, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import toast from "react-hot-toast"

type Question = {
  id: string
  question: string
  hint: string
  topic: string
  difficulty: string
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [revealedHints, setRevealedHints] = useState<Set<string>>(new Set())

  // Form State
  const [topic, setTopic] = useState("")
  const [difficulty, setDifficulty] = useState("MEDIUM")
  const [type, setType] = useState("coding")

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/questions")
      const data = await res.json()
      setQuestions(data)
    } catch (error) {
      toast.error("Failed to load questions")
    }
    setLoading(false)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic || cooldown) return

    setGenerating(true)
    setCooldown(true)

    try {
      const res = await fetch("/api/ai/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, type })
      })

      if (!res.ok) {
        throw new Error("AI response was malformed, please try again")
      }

      const newQuestions = await res.json()
      setQuestions(prev => [...newQuestions, ...prev])
      toast.success("Generated 5 new questions!")
    } catch (error: any) {
      toast.error(error.message)
    }

    setGenerating(false)
    setTimeout(() => setCooldown(false), 2000)
  }

  const toggleHint = (id: string) => {
    setRevealedHints(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Question Bank</h2>
        <p className="text-muted-foreground">Generate tailored practice questions using Google Gemini.</p>
      </div>

      <Card className="bg-muted/30 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" /> Generate New Questions
          </CardTitle>
          <CardDescription>Get exactly what you need to practice right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label>Topic</Label>
              <Input 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                placeholder="e.g., Dynamic Programming, System Design" 
                required 
              />
            </div>
            <div className="space-y-2 w-full sm:w-40">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full sm:w-40">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="theory">Theory</SelectItem>
                  <SelectItem value="system-design">System Design</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={generating || cooldown || !topic} className="w-full sm:w-auto">
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h3 className="text-xl font-semibold mt-4">Your Question Bank</h3>
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 border border-dashed rounded-lg text-muted-foreground">
            No questions generated yet. Create some above!
          </div>
        ) : (
          questions.map(q => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-base font-medium leading-relaxed">
                    {q.question}
                  </CardTitle>
                  <div className="flex gap-2 shrink-0">
                    <span className="text-xs bg-muted px-2 py-1 rounded-md">{q.topic}</span>
                    <span className={`text-xs px-2 py-1 rounded-md ${
                      q.difficulty === 'EASY' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      q.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>
                </div>
              </CardHeader>
              {q.hint && (
                <CardContent className="pt-0">
                  {revealedHints.has(q.id) ? (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-md text-sm flex gap-2 items-start mt-2">
                      <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p>{q.hint}</p>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => toggleHint(q.id)} className="mt-2 text-xs h-8">
                      <Lightbulb className="w-3 h-3 mr-2" /> Show Hint
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

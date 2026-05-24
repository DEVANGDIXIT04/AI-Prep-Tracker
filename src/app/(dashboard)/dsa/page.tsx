"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type DSAProblem = {
  id: string
  title: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  topic: string
  status: "TODO" | "SOLVING" | "DONE" | "REVISIT"
  notes?: string
}

const TOPICS = [
  "ARRAYS",
  "STRINGS",
  "LINKED_LISTS",
  "TREES",
  "GRAPHS",
  "DYNAMIC_PROGRAMMING",
  "BACKTRACKING",
  "GREEDY",
  "MATH",
  "BIT_MANIPULATION",
]

export default function DSAPage() {
  const [problems, setProblems] = useState<DSAProblem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProblem, setEditingProblem] = useState<DSAProblem | null>(null)
  
  // Form state
  const [title, setTitle] = useState("")
  const [difficulty, setDifficulty] = useState("EASY")
  const [topic, setTopic] = useState("ARRAYS")
  const [status, setStatus] = useState("TODO")
  const [notes, setNotes] = useState("")

  const fetchProblems = async () => {
    setLoading(true)
    let url = "/api/dsa?"
    if (filterDifficulty !== "ALL") url += `&difficulty=${filterDifficulty}`
    if (filterStatus !== "ALL") url += `&status=${filterStatus}`

    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      setProblems(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProblems()
  }, [filterDifficulty, filterStatus])

  const openModal = (problem?: DSAProblem) => {
    if (problem) {
      setEditingProblem(problem)
      setTitle(problem.title)
      setDifficulty(problem.difficulty)
      setTopic(problem.topic)
      setStatus(problem.status)
      setNotes(problem.notes || "")
    } else {
      setEditingProblem(null)
      setTitle("")
      setDifficulty("EASY")
      setTopic("ARRAYS")
      setStatus("TODO")
      setNotes("")
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!title) return

    const payload = { title, difficulty, topic, status, notes }

    if (editingProblem) {
      await fetch(`/api/dsa/${editingProblem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch("/api/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, solvedAt: status === "DONE" ? new Date() : null }),
      })
    }

    setIsModalOpen(false)
    fetchProblems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    await fetch(`/api/dsa/${id}`, { method: "DELETE" })
    fetchProblems()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">DSA Problems</h2>
          <p className="text-muted-foreground">Manage and track your coding practice.</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Problem
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-full sm:w-[200px]">
          <Label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
            Difficulty
          </Label>
          <Select value={filterDifficulty} onValueChange={(val) => setFilterDifficulty(val as string)}>
            <SelectTrigger>
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Difficulties</SelectItem>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[200px]">
          <Label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
            Status
          </Label>
          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as string)}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="SOLVING">Solving</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="REVISIT">Revisit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : problems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No problems found.
                </TableCell>
              </TableRow>
            ) : (
              problems.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell className="font-medium">{problem.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {problem.topic.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        problem.difficulty === "HARD"
                          ? "destructive"
                          : problem.difficulty === "MEDIUM"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {problem.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        problem.status === "DONE"
                          ? "border-green-500 text-green-500"
                          : problem.status === "REVISIT"
                          ? "border-amber-500 text-amber-500"
                          : ""
                      }
                    >
                      {problem.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openModal(problem)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => handleDelete(problem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProblem ? "Edit Problem" : "Add Problem"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Two Sum"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={(val) => setDifficulty(val as string)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as string)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="SOLVING">Solving</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                    <SelectItem value="REVISIT">Revisit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Topic</Label>
              <Select value={topic} onValueChange={(val) => setTopic(val as string)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOPICS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes or hints..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

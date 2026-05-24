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

type Contest = {
  id: string
  platform: string
  contestName: string
  date: string
  rank: number | null
  totalParticipants: number | null
  problemsSolved: number | null
  ratingChange: number | null
}

const PLATFORMS = ["LEETCODE", "CODEFORCES", "CODECHEF", "OTHER"]

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPlatform, setFilterPlatform] = useState("ALL")
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [platform, setPlatform] = useState("LEETCODE")
  const [contestName, setContestName] = useState("")
  const [date, setDate] = useState("")
  const [rank, setRank] = useState("")
  const [totalParticipants, setTotalParticipants] = useState("")
  const [problemsSolved, setProblemsSolved] = useState("")
  const [ratingChange, setRatingChange] = useState("")

  useEffect(() => {
    fetchContests()
  }, [filterPlatform])

  const fetchContests = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/contests?platform=${filterPlatform}`)
      const data = await res.json()
      setContests(data)
    } catch (error) {
      console.error("Failed to fetch contests", error)
    }
    setLoading(false)
  }

  const openAddDialog = () => {
    setEditingId(null)
    setPlatform("LEETCODE")
    setContestName("")
    setDate(new Date().toISOString().split("T")[0])
    setRank("")
    setTotalParticipants("")
    setProblemsSolved("")
    setRatingChange("")
    setIsDialogOpen(true)
  }

  const openEditDialog = (contest: Contest) => {
    setEditingId(contest.id)
    setPlatform(contest.platform)
    setContestName(contest.contestName)
    setDate(new Date(contest.date).toISOString().split("T")[0])
    setRank(contest.rank?.toString() || "")
    setTotalParticipants(contest.totalParticipants?.toString() || "")
    setProblemsSolved(contest.problemsSolved?.toString() || "")
    setRatingChange(contest.ratingChange?.toString() || "")
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      platform,
      contestName,
      date,
      rank: rank ? parseInt(rank) : null,
      totalParticipants: totalParticipants ? parseInt(totalParticipants) : null,
      problemsSolved: problemsSolved ? parseInt(problemsSolved) : null,
      ratingChange: ratingChange ? parseInt(ratingChange) : null,
    }

    try {
      if (editingId) {
        await fetch(`/api/contests/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch("/api/contests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      setIsDialogOpen(false)
      fetchContests()
    } catch (error) {
      console.error("Failed to save contest", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contest?")) return
    try {
      await fetch(`/api/contests/${id}`, { method: "DELETE" })
      fetchContests()
    } catch (error) {
      console.error("Failed to delete contest", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contests</h2>
          <p className="text-muted-foreground">Log your competitive programming contests.</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Contest
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end bg-muted/50 p-4 rounded-lg">
        <div className="space-y-2 flex-1 sm:max-w-[200px]">
          <Label>Platform</Label>
          <Select value={filterPlatform} onValueChange={(val) => setFilterPlatform(val as string)}>
            <SelectTrigger>
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Platforms</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Contest Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Rank</TableHead>
              <TableHead className="text-right">Solved</TableHead>
              <TableHead className="text-right">Rating ∆</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : contests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No contests found. Click "Add Contest" to get started.
                </TableCell>
              </TableRow>
            ) : (
              contests.map((contest) => (
                <TableRow key={contest.id}>
                  <TableCell className="font-medium">{contest.platform}</TableCell>
                  <TableCell>{contest.contestName}</TableCell>
                  <TableCell>{new Date(contest.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {contest.rank ? `${contest.rank} / ${contest.totalParticipants || '?'}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">{contest.problemsSolved ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    {contest.ratingChange ? (
                      <span className={contest.ratingChange > 0 ? "text-green-600" : "text-red-600"}>
                        {contest.ratingChange > 0 ? "+" : ""}{contest.ratingChange}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(contest)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(contest.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Contest" : "Add Contest"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(val) => setPlatform(val as string)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contest Name</Label>
              <Input 
                value={contestName} 
                onChange={(e) => setContestName(e.target.value)} 
                placeholder="e.g. Weekly Contest 400"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rank</Label>
                <Input type="number" value={rank} onChange={(e) => setRank(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Total Participants</Label>
                <Input type="number" value={totalParticipants} onChange={(e) => setTotalParticipants(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Problems Solved</Label>
                <Input type="number" value={problemsSolved} onChange={(e) => setProblemsSolved(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Rating Change</Label>
                <Input type="number" value={ratingChange} onChange={(e) => setRatingChange(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!contestName || !date}>
              {editingId ? "Save Changes" : "Add Contest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

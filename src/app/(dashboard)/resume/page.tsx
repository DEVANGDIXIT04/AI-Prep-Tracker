"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Download, CheckCircle, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Resume = {
  id: string
  version: string
  label: string | null
  fileUrl: string
  notes: string | null
  isActive: boolean
  createdAt: string
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  
  // Dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  
  // Form state
  const [file, setFile] = useState<File | null>(null)
  const [version, setVersion] = useState("1.0")
  const [label, setLabel] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/resume`)
      const data = await res.json()
      setResumes(data)
    } catch (error) {
      console.error("Failed to fetch resumes", error)
    }
    setLoading(false)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("version", version)
    formData.append("label", label)
    formData.append("notes", notes)

    try {
      await fetch("/api/resume", {
        method: "POST",
        body: formData,
      })
      setIsUploadDialogOpen(false)
      fetchResumes()
    } catch (error) {
      console.error("Upload failed", error)
    }
    setIsUploading(false)
  }

  const handleSetActive = async (id: string) => {
    try {
      await fetch(`/api/resume/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true })
      })
      fetchResumes()
    } catch (error) {
      console.error("Failed to set active", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume version?")) return
    try {
      await fetch(`/api/resume/${id}`, { method: "DELETE" })
      fetchResumes()
    } catch (error) {
      console.error("Failed to delete", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resume Vault</h2>
          <p className="text-muted-foreground">Manage your resume versions and select the active one.</p>
        </div>
        <Button onClick={() => {
          setFile(null)
          setVersion(`1.${resumes.length}`)
          setLabel("")
          setNotes("")
          setIsUploadDialogOpen(true)
        }}>
          <UploadCloud className="mr-2 h-4 w-4" /> Upload New Version
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-lg text-muted-foreground">
          No resumes uploaded yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <Card key={resume.id} className={`relative overflow-hidden ${resume.isActive ? 'border-primary ring-1 ring-primary/20 shadow-md bg-primary/5' : ''}`}>
              {resume.isActive && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg text-xs font-medium flex items-center shadow-sm">
                  <CheckCircle className="w-3 h-3 mr-1" /> Active
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  v{resume.version} {resume.label && <span className="ml-2 font-normal text-muted-foreground text-sm">- {resume.label}</span>}
                </CardTitle>
                <CardDescription>
                  Uploaded on {new Date(resume.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resume.notes ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">{resume.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No notes provided.</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={resume.fileUrl} target="_blank" rel="noreferrer">
                      <Download className="w-4 h-4 mr-2" /> View
                    </a>
                  </Button>
                </div>
                <div className="flex gap-2">
                  {!resume.isActive && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetActive(resume.id)}>
                      Set Active
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-destructive" onClick={() => handleDelete(resume.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Resume</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>File (PDF)</Label>
              <Input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Version</Label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Label (Optional)</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Frontend Focus" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes / What changed?</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Added new project..." />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!file || isUploading}>
                {isUploading ? "Uploading..." : "Upload Resume"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

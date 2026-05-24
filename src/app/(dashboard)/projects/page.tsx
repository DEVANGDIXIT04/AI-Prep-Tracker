"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates, rectSortingStrategy, SortableContext } from "@dnd-kit/sortable"
import { Plus, Pencil, Trash2, Code, ExternalLink, Bot, Loader2, Copy } from "lucide-react"
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
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import toast from "react-hot-toast"

type Project = {
  id: string
  title: string
  description: string | null
  techStack: string[]
  githubUrl: string | null
  liveUrl: string | null
  status: string
}

const COLUMNS = [
  { id: "IDEA", title: "Ideas" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "COMPLETED", title: "Completed" },
  { id: "DEPLOYED", title: "Deployed" },
]

function SortableProjectCard({ 
  project, 
  onEdit, 
  onDelete 
}: { 
  project: Project, 
  onEdit: (p: Project) => void, 
  onDelete: (id: string) => void,
  onGenerateHighlights: (p: Project) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: project.id, data: project })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card text-card-foreground border rounded-lg shadow-sm p-4 cursor-grab active:cursor-grabbing mb-3"
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm">{project.title}</h4>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" className="h-6 w-6" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="h-6 w-6" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onGenerateHighlights(project); }}>
            <Bot className="h-3 w-3 text-primary" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="h-6 w-6" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>
      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
      )}
      {project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {project.techStack.map(t => (
            <span key={t} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2 text-muted-foreground">
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()} className="hover:text-foreground transition-colors">
            <Code className="h-4 w-4" />
          </a>
        )}
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()} className="hover:text-foreground transition-colors">
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  )
}

function Column({ id, title, projects, onEdit, onDelete, onGenerateHighlights }: { id: string, title: string, projects: Project[], onEdit: (p: Project) => void, onDelete: (id: string) => void, onGenerateHighlights: (p: Project) => void }) {
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: "Column",
      columnId: id
    }
  });

  return (
    <div className="flex flex-col bg-muted/30 rounded-xl p-4 w-[300px] shrink-0 h-full border">
      <h3 className="font-semibold mb-4 text-sm flex justify-between items-center">
        {title} <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{projects.length}</span>
      </h3>
      <div ref={setNodeRef} className="flex-1 overflow-y-auto">
        <SortableContext items={projects.map(p => p.id)} strategy={rectSortingStrategy}>
          {projects.map(project => (
            <SortableProjectCard 
              key={project.id} 
              project={project} 
              onEdit={onEdit}
              onDelete={onDelete}
              onGenerateHighlights={onGenerateHighlights}
            />
          ))}
        </SortableContext>
        {projects.length === 0 && (
          <div className="h-20 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [techStack, setTechStack] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [status, setStatus] = useState("IDEA")

  // AI Highlights state
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const [generatingAi, setGeneratingAi] = useState(false)
  const [aiHighlights, setAiHighlights] = useState<string[]>([])
  const [aiTargetProject, setAiTargetProject] = useState<string>("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/projects`)
      const data = await res.json()
      setProjects(data)
    } catch (error) {
      console.error("Failed to fetch projects", error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const projectId = active.id as string
    const activeData = active.data.current as Project
    const overId = over.id as string
    
    // Determine the new status column
    let newStatus = activeData.status
    if (COLUMNS.find(c => c.id === overId)) {
      newStatus = overId
    } else {
      const overProject = projects.find(p => p.id === overId)
      if (overProject) newStatus = overProject.status
    }

    if (newStatus !== activeData.status) {
      // Optimistic UI update
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p))
      
      // Update DB
      try {
        await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        })
      } catch (error) {
        console.error("Failed to update status", error)
        fetchProjects() // revert on fail
      }
    }
  }

  const openAddDialog = () => {
    setEditingId(null)
    setTitle("")
    setDescription("")
    setTechStack("")
    setGithubUrl("")
    setLiveUrl("")
    setStatus("IDEA")
    setIsDialogOpen(true)
  }

  const openEditDialog = (p: Project) => {
    setEditingId(p.id)
    setTitle(p.title)
    setDescription(p.description || "")
    setTechStack(p.techStack.join(", "))
    setGithubUrl(p.githubUrl || "")
    setLiveUrl(p.liveUrl || "")
    setStatus(p.status)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      title,
      description,
      techStack: techStack.split(",").map(s => s.trim()).filter(Boolean),
      githubUrl,
      liveUrl,
      status
    }

    try {
      if (editingId) {
        await fetch(`/api/projects/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      setIsDialogOpen(false)
      fetchProjects()
    } catch (error) {
      console.error("Failed to save project", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" })
      fetchProjects()
    } catch (error) {
      console.error("Failed to delete project", error)
    }
  }

  const handleGenerateHighlights = async (project: Project) => {
    setAiTargetProject(project.title)
    setAiHighlights([])
    setIsAiDialogOpen(true)
    setGeneratingAi(true)

    try {
      const res = await fetch("/api/ai/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.title,
          description: project.description,
          techStack: project.techStack
        })
      })

      if (!res.ok) throw new Error("Failed to generate highlights")
      const highlights = await res.json()
      setAiHighlights(highlights)
    } catch (error: any) {
      toast.error(error.message)
      setIsAiDialogOpen(false)
    }
    setGeneratingAi(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects Kanban</h2>
          <p className="text-muted-foreground">Manage your portfolio projects and ideas.</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full items-start min-h-[500px]">
            {COLUMNS.map(col => (
              <Column 
                key={col.id} 
                id={col.id} 
                title={col.title} 
                projects={projects.filter(p => p.status === col.id)} 
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onGenerateHighlights={handleGenerateHighlights}
              />
            ))}
          </div>
        </DndContext>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Project" : "Add Project"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project Name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
            </div>
            <div className="space-y-2">
              <Label>Tech Stack</Label>
              <Input value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="React, Node.js, Tailwind (comma separated)" />
            </div>
            <div className="space-y-2">
              <Label>GitHub URL</Label>
              <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Live URL</Label>
              <Input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!title}>
              {editingId ? "Save Changes" : "Add Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" /> AI Resume Highlights
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Generated bullets for <strong>{aiTargetProject}</strong></p>
          </DialogHeader>
          <div className="py-4">
            {generatingAi ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p>Generating high-impact resume bullets...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiHighlights.map((bullet, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 bg-muted/30 border rounded-lg hover:bg-muted/50 transition-colors">
                    <p className="text-sm flex-1 leading-relaxed">{bullet}</p>
                    <Button variant="ghost" size="icon-sm" className="shrink-0 h-7 w-7" onClick={() => copyToClipboard(bullet)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAiDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

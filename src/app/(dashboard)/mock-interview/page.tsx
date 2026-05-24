"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, User, Send, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import toast from "react-hot-toast"

type Message = {
  role: "user" | "model"
  content: string
}

export default function MockInterviewPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Hello! I'll be your technical interviewer today. We'll go through a medium-level DSA question, and I'll evaluate your approach. Ready to begin?" }
  ])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [saving, setSaving] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || streaming) return

    const userMessage: Message = { role: "user", content: input.trim() }
    const newHistory = [...messages, userMessage]
    setMessages(newHistory)
    setInput("")
    setStreaming(true)

    // Add empty model message for streaming
    setMessages([...newHistory, { role: "model", content: "" }])

    try {
      const res = await fetch("/api/ai/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newHistory })
      })

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1].content += chunk
            return updated
          })
        }
      }
    } catch (error) {
      toast.error("Failed to connect to interviewer")
    }

    setStreaming(false)
  }

  const handleEndSession = async () => {
    if (messages.length < 3) {
      toast("The interview was too short to save.", { icon: '⚠️' })
      return
    }

    setSaving(true)
    try {
      // Extract a score if the model mentioned one out of 10. (Basic regex)
      const lastMsg = messages[messages.length - 1].content
      const scoreMatch = lastMsg.match(/(\d+)\/10/)
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null

      const res = await fetch("/api/ai/mock/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: messages, score })
      })

      if (!res.ok) throw new Error("Failed to save transcript")
      toast.success("Interview transcript saved!")
    } catch (error: any) {
      toast.error(error.message)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mock Interviewer</h2>
        <p className="text-muted-foreground">Practice your DSA skills with a strict, fair AI interviewer.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-primary/20 shadow-md">
        <CardHeader className="bg-muted/50 border-b shrink-0 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Interviewer Chat</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleEndSession} disabled={saving || streaming}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              End Session & Save
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-card">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-xl whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-muted/60 border rounded-tl-none'
              }`}>
                {msg.content}
                {streaming && msg.role === 'model' && idx === messages.length - 1 && msg.content === "" && (
                  <span className="flex gap-1 h-4 items-center">
                    <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce delay-150"></span>
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </CardContent>

        <CardFooter className="bg-card border-t shrink-0 p-4">
          <form onSubmit={handleSend} className="flex w-full gap-2">
            <Input 
              placeholder="Type your approach or code here..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || streaming}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

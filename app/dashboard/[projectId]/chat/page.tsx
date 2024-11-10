'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, ClipboardList, Send, Loader2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMessage, ProjectStatus } from '@/lib/types'
import { db } from '@/lib/firebase'
import { onSnapshot, doc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { FileUpload } from '@/components/file-upload'
import ReactMarkdown from 'react-markdown'

const VALID_TABS = ['scope', 'proposal'] as const
type ChatType = typeof VALID_TABS[number]

export default function ChatPage() {
  const { projectId } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState<ProjectStatus | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState<ChatType>('scope')
  const [attachments, setAttachments] = useState<Array<{ url: string; type: string; name: string }>>([])
  const [streamingResponse, setStreamingResponse] = useState('')
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!projectId || typeof projectId !== 'string') return

    const unsubscribe = onSnapshot(
      doc(db, 'projects', projectId),
      (doc) => {
        if (!doc.exists()) {
          toast({
            title: 'Error',
            description: 'Project not found',
            variant: 'destructive',
          })
          router.push('/dashboard')
          return
        }
        setProject({ ...doc.data(), id: doc.id } as ProjectStatus)
        setStreamingResponse('')
        setPendingMessage(null)
      },
      (error) => {
        console.error('Error loading project:', error)
        toast({
          title: 'Error',
          description: 'Failed to load project data',
          variant: 'destructive',
        })
      }
    )

    return () => {
      unsubscribe()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [projectId, router, toast])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [project?.chatHistory, streamingResponse])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && VALID_TABS.includes(tab as ChatType)) {
      setActiveTab(tab as ChatType)
    } else {
      // Redirect to scope chat if no valid tab is provided
      router.push(`/dashboard/${projectId}/chat?tab=scope`)
    }
  }, [searchParams, projectId, router])

  const handleTabChange = (value: string) => {
    if (VALID_TABS.includes(value as ChatType)) {
      setActiveTab(value as ChatType)
      router.push(`/dashboard/${projectId}/chat?tab=${value}`)
    }
  }

  const handleDownloadScope = async () => {
    if (!project?.scope) {
      toast({
        title: 'Error',
        description: 'No scope available to download',
        variant: 'destructive',
      })
      return
    }

    setIsDownloading(true)
    try {
      const response = await fetch('/api/download/scope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        throw new Error('Failed to download scope')
      }

      // Get the blob from the response
      const blob = await response.blob()
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)
      
      // Create a temporary link element
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name}-Scope.docx`
      
      // Trigger the download
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Scope document downloaded successfully',
      })
    } catch (error) {
      console.error('Error downloading scope:', error)
      toast({
        title: 'Error',
        description: 'Failed to download scope document',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !projectId || typeof projectId !== 'string') return

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsLoading(true)
    setStreamingResponse('')
    setPendingMessage(input)
    const currentInput = input
    setInput('')

    abortControllerRef.current = new AbortController()

    try {
      const payload = {
        projectId,
        message: currentInput,
        type: activeTab,
        ...(attachments.length > 0 && { attachments })
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const text = line.slice(6)
            setStreamingResponse(prev => prev + text)
          }
        }
      }
      
      setAttachments([])
      setPendingMessage(null)
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted')
        return
      }
      console.error('Chat error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      })
      setPendingMessage(null)
      setInput(currentInput)
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleFileUpload = async (fileUrl: string, fileName: string, fileType: string) => {
    setAttachments(prev => [...prev, { url: fileUrl, type: fileType, name: fileName }])
    toast({
      title: 'Success',
      description: 'File attached successfully',
    })
  }

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => (
      <div key={i}>
        <ReactMarkdown>{line}</ReactMarkdown>
      </div>
    ))
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <div className="flex justify-between items-center">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="scope" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Scope
              </TabsTrigger>
              <TabsTrigger value="proposal" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Proposal
              </TabsTrigger>
            </TabsList>
            {activeTab === 'scope' && project.scope && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadScope}
                disabled={isDownloading}
                className="ml-4"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Scope
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4 max-w-2xl mx-auto">
                {project?.chatHistory
                  ?.filter((msg: ChatMessage) => msg.type === activeTab)
                  .map((message: ChatMessage) => (
                    <div
                      key={message.id}
                      className="space-y-2"
                    >
                      <div className={cn(
                        'flex items-start gap-3 text-sm',
                        message.role === 'assistant' && 'flex-row-reverse'
                      )}>
                        <div
                          className={cn(
                            'rounded-lg px-3 py-2 max-w-[80%] whitespace-pre-wrap',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {formatMessage(message.content)}
                        </div>
                      </div>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className={cn(
                          'flex gap-2',
                          message.role === 'assistant' && 'justify-end'
                        )}>
                          {message.attachments.map((attachment, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4 mr-2" />
                                {attachment.name}
                              </a>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                {pendingMessage && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="rounded-lg px-3 py-2 max-w-[80%] bg-primary text-primary-foreground whitespace-pre-wrap">
                      {formatMessage(pendingMessage)}
                    </div>
                  </div>
                )}
                {streamingResponse && (
                  <div className="flex items-start gap-3 text-sm flex-row-reverse">
                    <div className="rounded-lg px-3 py-2 max-w-[80%] bg-muted whitespace-pre-wrap">
                      {formatMessage(streamingResponse)}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="max-w-2xl mx-auto space-y-4">
                {activeTab === 'proposal' && (
                  <div className="flex items-center gap-2">
                    <FileUpload onUploadComplete={handleFileUpload} />
                    {attachments.map((attachment, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {attachment.name}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                    placeholder={`Type your ${activeTab} message...`}
                    className="min-h-[60px]"
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e as any)
                      }
                    }}
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <div className="w-80 border-l p-4">
            {activeTab === 'scope' && project?.scope && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Scope</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm whitespace-pre-wrap">
                    {formatMessage(project.scope.content)}
                  </div>
                </CardContent>
              </Card>
            )}
            {activeTab === 'proposal' && project?.proposal && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Proposal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm whitespace-pre-wrap mb-4">
                    {formatMessage(project.proposal.content)}
                  </div>
                  {project.proposal.attachmentUrl && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={project.proposal.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        View Proposal Document
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  )
}

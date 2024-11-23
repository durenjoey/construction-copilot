'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ScrollArea } from 'components/ui/scroll-area'
import { Button } from 'components/ui/button'
import { Textarea } from 'components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs'
import { FileText, ClipboardList, Send, Loader2, Download, ArrowLeft, AlertCircle, User, Bot } from 'lucide-react'
import { cn } from 'lib/utils'
import { ChatMessage, ProjectStatus, Attachment } from 'lib/types'
import { db } from 'lib/firebase'
import { doc, onSnapshot, DocumentSnapshot } from 'firebase/firestore'
import { useToast } from 'hooks/use-toast'
import { FileUpload } from 'components/file-upload'
import { SidePanel } from 'components/side-panel'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

const VALID_TABS = ['scope', 'proposal'] as const
type ChatType = typeof VALID_TABS[number]
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export default function ChatPage() {
  const params = useParams() as { projectId: string }
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState<ProjectStatus | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState<ChatType>('scope')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [retryCount, setRetryCount] = useState(0)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [shouldScroll, setShouldScroll] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device on mount
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()))
    }
    checkMobile()
  }, [])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      } catch (error) {
        console.error('Error scrolling:', error)
      }
    }
  }

  // Handle project data loading
  useEffect(() => {
    if (!params.projectId) return

    const unsubscribe = onSnapshot(
      doc(db, 'projects', params.projectId),
      (doc: DocumentSnapshot) => {
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
        setShouldScroll(true)
      },
      (error: Error) => {
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
    }
  }, [params.projectId, router, toast])

  // Handle scrolling separately
  useEffect(() => {
    if (shouldScroll) {
      scrollToBottom()
      setShouldScroll(false)
    }
  }, [shouldScroll])

  // Update scroll when new messages arrive or streaming changes
  useEffect(() => {
    if (project?.chatHistory || streamingMessage) {
      setShouldScroll(true)
    }
  }, [project?.chatHistory, streamingMessage])

  // Handle tab changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && VALID_TABS.includes(tab as ChatType)) {
      setActiveTab(tab as ChatType)
    } else {
      router.push(`/dashboard/${params.projectId}/chat?tab=scope`)
    }
  }, [searchParams, params.projectId, router])

  const handleTabChange = (value: string) => {
    if (VALID_TABS.includes(value as ChatType)) {
      setActiveTab(value as ChatType)
      router.push(`/dashboard/${params.projectId}/chat?tab=${value}`)
      setShouldScroll(true)
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
        body: JSON.stringify({ projectId: params.projectId }),
      })

      if (!response.ok) {
        throw new Error('Failed to download scope')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name}-Scope.docx`
      document.body.appendChild(a)
      a.click()
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

  const sendMessage = async (currentInput: string, retryAttempt = 0): Promise<boolean> => {
    try {
      const payload = {
        projectId: params.projectId,
        message: currentInput,
        type: activeTab,
        ...(attachments.length > 0 && { attachments })
      }

      console.log('Sending chat request:', payload)

      setIsThinking(true)
      setStreamingMessage('')
      setIsStreaming(true)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Chat API error response:', errorData)
        throw new Error(errorData.error || errorData.details || 'Failed to send message')
      }

      setIsThinking(false)

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream available')

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          setIsStreaming(false)
          setStreamingMessage('')
          break
        }

        const text = new TextDecoder().decode(value)
        setStreamingMessage(prev => prev + text)
      }

      return true
    } catch (error) {
      console.error(`Chat error (attempt ${retryAttempt + 1}/${MAX_RETRIES}):`, error)
      
      if (retryAttempt < MAX_RETRIES - 1) {
        toast({
          title: 'Retrying...',
          description: `Attempt ${retryAttempt + 2} of ${MAX_RETRIES}`,
        })
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return sendMessage(currentInput, retryAttempt + 1)
      }

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsThinking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !params.projectId) return

    setIsLoading(true)
    const currentInput = input
    setInput('')
    setRetryCount(0)

    try {
      const success = await sendMessage(currentInput)
      if (!success) {
        setInput(currentInput)
      } else {
        setAttachments([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      // On mobile, always treat Enter as a new line
      if (isMobile) {
        return
      }
      
      // On desktop, Enter sends the message unless Shift is held
      if (!e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
    }
  }

  const handleFileUpload = async (fileUrl: string, fileName: string, fileType: string, fileContent: string) => {
    setAttachments(prev => [...prev, { 
      url: fileUrl, 
      type: fileType, 
      name: fileName,
      content: fileContent 
    }])
    toast({
      title: 'Success',
      description: 'File attached successfully',
    })
  }

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => (
      <div key={i} className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-medium mt-2 mb-1">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="marker:text-foreground">{children}</li>,
            p: ({ children }) => <p className="my-2">{children}</p>,
            code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>,
            pre: ({ children }) => <pre className="bg-muted p-3 rounded-lg my-2 overflow-x-auto">{children}</pre>,
          }}
        >
          {line}
        </ReactMarkdown>
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

  const filteredChatHistory = project.chatHistory?.filter((msg: ChatMessage) => msg.type === activeTab) || []

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b px-4 py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1">
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
          </Tabs>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/dashboard/${params.projectId}`}>
                Back to Project
              </Link>
            </Button>
            {activeTab === 'scope' && project.scope && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadScope}
                disabled={isDownloading}
                className="w-full sm:w-auto"
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
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <ScrollArea className="absolute inset-0 p-4">
              <div className="space-y-6 max-w-3xl mx-auto">
                {filteredChatHistory.map((message: ChatMessage) => (
                  <div
                    key={message.id}
                    className="space-y-3"
                  >
                    <div className={cn(
                      'flex items-start gap-3',
                      message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                    )}>
                      <div className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        {message.role === 'user' ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <Bot className="h-5 w-5" />
                        )}
                      </div>
                      <div
                        className={cn(
                          'rounded-lg px-4 py-3 max-w-[85%] sm:max-w-[75%]',
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
                        'flex gap-2 flex-wrap pl-11',
                        message.role === 'user' && 'justify-end pr-11 pl-0'
                      )}>
                        {message.attachments.map((attachment: Attachment, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            asChild
                            className="max-w-[200px] group hover:bg-muted/80"
                          >
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <FileText className="h-4 w-4 mr-2 flex-shrink-0 group-hover:text-primary" />
                              <span className="truncate text-sm">{attachment.name}</span>
                            </a>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isThinking && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3 max-w-[85%] sm:max-w-[75%]">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                {streamingMessage && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3 max-w-[85%] sm:max-w-[75%]">
                      {formatMessage(streamingMessage)}
                    </div>
                  </div>
                )}
                {isLoading && retryCount > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Retrying... Attempt {retryCount + 1} of {MAX_RETRIES}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-3xl mx-auto space-y-4">
              {activeTab === 'proposal' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <FileUpload onUploadComplete={handleFileUpload} />
                  {attachments.map((attachment, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                      className="max-w-[200px] group hover:bg-destructive/10"
                    >
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0 group-hover:text-destructive" />
                      <span className="truncate text-sm group-hover:text-destructive">{attachment.name}</span>
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Type your ${activeTab} message...${isMobile ? '' : ' (Press Enter to send, Shift+Enter for new line)'}`}
                  className="min-h-[60px] resize-none"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="h-auto px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Side Panel */}
        {activeTab === 'scope' && project?.scope && (
          <SidePanel title="Current Scope">
            <div className="text-sm">
              {formatMessage(project.scope.content)}
            </div>
          </SidePanel>
        )}
        {activeTab === 'proposal' && project?.proposal && (
          <SidePanel title="Current Proposal">
            <div className="space-y-4">
              <div className="text-sm">
                {formatMessage(project.proposal.content)}
              </div>
              {project.proposal.attachmentUrl && (
                <Button variant="outline" size="sm" className="w-full group hover:bg-muted/80" asChild>
                  <a href={project.proposal.attachmentUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2 group-hover:text-primary" />
                    View Proposal Document
                  </a>
                </Button>
              )}
            </div>
          </SidePanel>
        )}
      </div>
    </div>
  )
}

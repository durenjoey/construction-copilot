import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { ChatMessage, ProjectStatus, Attachment } from '@/lib/types'
import { Anthropic } from '@anthropic-ai/sdk'

const SYSTEM_PROMPTS = {
  scope: `You are a construction project scope generator. Help create detailed, structured project scopes. Consider:
- Project objectives and deliverables
- Timeline and milestones
- Resource requirements
- Technical specifications
- Constraints and assumptions
Format your response in a clear, structured way with sections and bullet points.`,
  proposal: `You are a construction proposal reviewer. Review the uploaded proposal document and provide analysis for:
- Completeness and clarity
- Technical feasibility
- Cost reasonableness
- Risk assessment
- Compliance with requirements
If a proposal document is attached, analyze its contents and provide specific feedback and recommendations for improvement.`
}

export const maxDuration = 300 // Set max duration to 5 minutes
export const dynamic = 'force-dynamic' // Disable static optimization

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log('Received request body:', JSON.stringify(body, null, 2))
    
    const { message, projectId, type, attachments } = body as {
      message: string;
      projectId: string;
      type: 'scope' | 'proposal';
      attachments?: Attachment[];
    }

    if (!message || !projectId || !type) {
      console.error('Missing required fields:', { message, projectId, type })
      return NextResponse.json(
        { error: 'Message, projectId, and type are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured')
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }

    // Get project and chat history
    console.log('Fetching project:', projectId)
    const projectRef = adminDb.collection('projects').doc(projectId)
    const projectDoc = await projectRef.get()

    if (!projectDoc.exists) {
      console.error('Project not found:', projectId)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const project = projectDoc.data() as ProjectStatus
    const chatHistory = project.chatHistory || []

    // Prepare context for AI
    const systemPrompt = SYSTEM_PROMPTS[type]
    if (!systemPrompt) {
      console.error('Invalid chat type:', type)
      return NextResponse.json(
        { error: 'Invalid chat type' },
        { status: 400 }
      )
    }
    
    // Format messages for Claude 3.5 Sonnet
    const messages = chatHistory
      .filter((msg: ChatMessage) => msg.type === type)
      .slice(-10)
      .map((msg: ChatMessage) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content + (msg.attachments ? `\n\nAttached documents:\n${msg.attachments.map((a: Attachment) => `- ${a.name}: ${a.url}`).join('\n')}` : '')
      }))

    // Add attachment information to the message if present
    const userMessage = attachments && attachments.length > 0
      ? `${systemPrompt}\n\n${message}\n\nI've attached the following documents:\n${attachments.map((a: Attachment) => `- ${a.name}: ${a.url}`).join('\n')}`
      : `${systemPrompt}\n\n${message}`

    console.log('Initializing Anthropic client')
    
    try {
      // Initialize Anthropic client
      const anthropic = new Anthropic({
        apiKey,
        maxRetries: 3
      })

      console.log('Sending request to Anthropic API with model: claude-3-sonnet-20240229')

      // Send request to Claude 3.5 Sonnet
      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        messages: [
          ...messages,
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
      })

      console.log('Received response from Anthropic:', JSON.stringify(response, null, 2))

      if (!response.content || !response.content[0] || !('text' in response.content[0])) {
        console.error('Unexpected response format:', response)
        throw new Error('Unexpected response format from AI')
      }

      const aiResponse = response.content[0].text

      // Create new user message
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        type,
        ...(attachments && attachments.length > 0 && { attachments }),
        timestamp: new Date().toISOString()
      }

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        type,
        timestamp: new Date().toISOString()
      }

      // Batch write all updates
      const batch = adminDb.batch()

      // Update chat history
      batch.update(projectRef, {
        chatHistory: [...chatHistory, newMessage, assistantMessage]
      })

      // Update specific sections based on type
      if (type === 'scope') {
        batch.update(projectRef, {
          scope: {
            id: Date.now().toString(),
            content: aiResponse,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      } else if (type === 'proposal') {
        batch.update(projectRef, {
          'proposal.content': aiResponse,
          'proposal.updatedAt': new Date().toISOString()
        })
      }

      await batch.commit()
      console.log('Database updated successfully')

      return NextResponse.json({ message: assistantMessage })

    } catch (apiError) {
      console.error('AI API error:', apiError instanceof Error ? apiError.message : 'Unknown error', apiError)
      return NextResponse.json(
        { error: 'Failed to get AI response', details: apiError instanceof Error ? apiError.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Chat API error:', error instanceof Error ? error.message : 'Unknown error', error)
    return NextResponse.json(
      { error: 'Failed to process message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

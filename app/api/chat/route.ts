import { NextResponse } from 'next/server'
import { adminDb } from 'lib/firebase-admin'
import { ChatMessage, ProjectStatus, Attachment } from 'lib/types'
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

    // Prepare message with attachments
    let fullMessage = message
    if (attachments && attachments.length > 0) {
      const attachmentContents = attachments.map(attachment => 
        `Document: ${attachment.name}\nContent:\n${attachment.content}`
      ).join('\n\n')
      fullMessage = `${message}\n\nAttached Documents:\n${attachmentContents}`
    }

    try {
      // Initialize Anthropic client
      const anthropic = new Anthropic({
        apiKey
      })

      // Convert chat history to Anthropic message format
      const previousMessages = chatHistory
        .filter(msg => msg.type === type) // Only include messages of the same type
        .map(msg => {
          let content = msg.content
          if (msg.attachments && msg.attachments.length > 0) {
            const attachmentContents = msg.attachments
              .map(att => `Document: ${att.name}\nContent:\n${att.content}`)
              .join('\n\n')
            content = `${content}\n\nAttached Documents:\n${attachmentContents}`
          }
          return {
            role: msg.role as "user" | "assistant",
            content
          }
        })

      // Send request to Claude 3.5 Sonnet with chat history
      // Include system prompt in the first message
      const messages = previousMessages.length > 0 ? 
        [...previousMessages, { role: "user" as const, content: fullMessage }] :
        [{ role: "user" as const, content: `${systemPrompt}\n\n${fullMessage}` }]

      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4096,
        messages,
        temperature: 0.7,
      })

      console.log('Received response from Anthropic:', JSON.stringify(response, null, 2))

      if (!response.content || !response.content[0] || !('text' in response.content[0])) {
        throw new Error('Unexpected response format from AI')
      }

      const aiResponse = response.content[0].text

      // Create messages
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        type,
        timestamp: new Date().toISOString(),
        ...(attachments && attachments.length > 0 ? { attachments } : {}) // Only include attachments if they exist
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        type,
        timestamp: new Date().toISOString()
      }

      // Update Firestore
      await projectRef.update({
        chatHistory: [...chatHistory, newMessage, assistantMessage],
        ...(type === 'scope' ? {
          scope: {
            id: Date.now().toString(),
            content: aiResponse,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        } : {
          'proposal.content': aiResponse,
          'proposal.updatedAt': new Date().toISOString()
        })
      })

      return NextResponse.json({ message: assistantMessage })

    } catch (apiError) {
      console.error('AI API error:', apiError)
      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

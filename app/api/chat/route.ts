import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { ChatMessage, ProjectStatus } from '@/lib/types'

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
    
    const { message, projectId, type, attachments } = body

    if (!message || !projectId || !type) {
      console.error('Missing required fields:', { message, projectId, type })
      return NextResponse.json(
        { error: 'Message, projectId, and type are required' },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
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
    const systemPrompt = SYSTEM_PROMPTS[type as keyof typeof SYSTEM_PROMPTS]
    if (!systemPrompt) {
      console.error('Invalid chat type:', type)
      return NextResponse.json(
        { error: 'Invalid chat type' },
        { status: 400 }
      )
    }
    
    // Format messages according to Anthropic's API specification
    const messages = chatHistory
      .filter(msg => msg.type === type)
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content + (msg.attachments ? `\n\nAttached documents:\n${msg.attachments.map(a => `- ${a.name}: ${a.url}`).join('\n')}` : '')
      }))

    // Add attachment information to the message if present
    const userMessage = attachments 
      ? `${message}\n\nI've attached the following documents:\n${attachments.map((a: any) => `- ${a.name}: ${a.url}`).join('\n')}`
      : message

    console.log('Sending request to Anthropic API')
    
    try {
      // Get streaming response from Anthropic
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1024,
          messages: [
            ...messages,
            { role: 'user', content: userMessage }
          ],
          system: systemPrompt,
          stream: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Anthropic API error:', error)
        throw new Error(error.error?.message || 'Failed to get AI response')
      }

      // Create a TransformStream for server-sent events
      const encoder = new TextEncoder()
      const stream = new TransformStream()
      const writer = stream.writable.getWriter()

      // Process the streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        console.error('No response body from Anthropic API')
        throw new Error('No response body')
      }

      let aiResponse = ''
      
      // Start processing the stream
      ;(async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = line.slice(6)
                  if (data === '[DONE]') continue

                  const parsed = JSON.parse(data)
                  // Handle Claude 3 streaming format
                  if (parsed.type === 'message_delta' && parsed.delta?.text) {
                    aiResponse += parsed.delta.text
                    await writer.write(encoder.encode(`data: ${parsed.delta.text}\n\n`))
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e)
                  continue
                }
              }
            }
          }

          if (!aiResponse) {
            throw new Error('No response received from AI')
          }

          console.log('Stream completed, saving to database')

          // Save the complete response to the database
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: aiResponse,
            type,
            timestamp: new Date().toISOString()
          }

          // Create new user message
          const newMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            type,
            attachments,
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
          
          await writer.close()
        } catch (error) {
          console.error('Stream processing error:', error instanceof Error ? error.message : 'Unknown error')
          if (writer) {
            try {
              await writer.abort(new Error(error instanceof Error ? error.message : 'Stream processing failed'))
            } catch (abortError) {
              console.error('Error aborting writer:', abortError)
            }
          }
          throw error // Re-throw to be caught by outer catch block
        }
      })()

      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })

    } catch (apiError) {
      console.error('AI API error:', apiError instanceof Error ? apiError.message : 'Unknown error')
      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Chat API error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

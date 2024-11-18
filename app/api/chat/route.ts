import { NextResponse } from 'next/server'
import { adminDb } from 'lib/firebase-admin'
import { ChatMessage, ProjectStatus, Attachment } from 'lib/types'
import { Anthropic } from '@anthropic-ai/sdk'

const SYSTEM_PROMPTS = {
  scope: `You are Construction Copilot's Scope Generation specialist. Your role is to help users develop clear, comprehensive scopes of work for construction projects through collaborative conversation.
CORE BEHAVIOR:

Begin by asking users to describe their project type naturally
If description seems incomplete, gently prompt for more details
Assess user's construction experience level early with examples:

Low: "I'm new to construction projects"
Medium: "I've worked on a few projects before"
High: "I manage construction projects regularly"


Adjust terminology based on stated experience AND observed understanding
Keep language professional but accessible, increasing technical depth only when appropriate

DOCUMENT HANDLING:

When documents are shared, confirm understanding by:

Summarizing key points identified
Listing relevant sections to incorporate
Seeking user confirmation before proceeding


Note any limitations in drawing interpretation capabilities

SCOPE DEVELOPMENT:

Work section-by-section based on project type
For each section:

Provide narrative overview
List specific scope items as bullets
Identify potential risks and considerations


Always note gaps in information but continue progress
Ask ONE relevant question at a time to gather missing details

RISK MANAGEMENT:

Proactively identify risks within each scope section
Present risks as considerations rather than blockers
Ask users about additional risks they've identified
Include risk notes within relevant scope sections

OUTPUT FORMAT:

Each section includes:

Narrative overview explaining approach and key considerations
Detailed bullet points for specific requirements


Before finalizing:

Offer complete draft review
Ask if additional sections are needed
Allow format preference (narrative, bullets, or both)



SCOPE ITERATIONS:

Focus on requested section while considering whole scope
Ask for specific section to modify
Note potential impacts on other sections
Don't modify unrequested sections
Keep conversation focused on current modification

CONVERSATION STYLE:

One question at a time
Professional but approachable tone
Technical terms explained when first introduced
Clear section transitions
Regular confirmation of understanding

REMEMBER:

Never refuse to proceed due to missing information
Note gaps but continue progress
Focus on scope of work only (not timeline/budget yet)
Adapt detail level to project size
Support document uploads but note drawing limitations`,
  proposal: `You are Construction Copilot's Proposal Review specialist. Your role is to perform detailed, critical reviews of construction proposals, identifying potential issues, ambiguities, and areas of concern.
INITIAL SETUP:

After receiving proposal (PDF, Word, or pasted text), ask if there's a scope to compare against
If scope provided, use it as primary comparison baseline
If no scope provided, review proposal on its own merits against industry standards

REVIEW APPROACH:

Analyze proposal sequentially (top to bottom)
Flag issues as they appear in the document
Maintain document flow for easy side-by-side comparison
Focus on:

Scope alignment (if scope provided)
Logic and consistency
Legal terms and conditions
Hidden costs and red flags
Technical accuracy
Completeness



RED FLAGS AND CONCERNS:

Identify non-standard terms or conditions
Express confidence level in concerns:

"Strongly encourage attention to..."
"This appears to be a moderate concern..."
"Slight deviation from standard practice..."


Explain why each flagged item is concerning
Focus on material issues, avoid minor nitpicking
Note potentially hidden costs or misleading terms

LEGAL AND CONTRACTUAL REVIEW:

Flag non-standard terms with industry context
Provide examples of typical language when relevant
Identify missing standard protections
Note unusual liability or risk transfers
Flag problematic clauses (e.g., "no change orders")

AMBIGUITY HANDLING:

Flag unclear or ambiguous language
Draft specific clarification questions
Provide context for why clarification is needed
Suggest reaching out to proposal sender
Flag potentially misleading technical language

OUTPUT FORMAT:

Follow proposal's own structure
For each issue noted:

Quote or reference the relevant text
Explain the concern
Provide confidence level
Suggest clarification questions if needed


End with confirmation of review completion
Note "All other sections appear to meet industry standards" if applicable

COMMUNICATION STYLE:

Direct and clear about issues
No sugar-coating but no exaggeration
Match concern level to issue severity
Professional and objective tone
Focus on material issues

SKIP UNLESS REQUESTED:

Positive aspects of proposal
Minor formatting issues
Style preferences
Non-material deviations
Standard terms that are properly used

REMEMBER:

Read sequential, analyze sequential
Stay focused on material issues
Be direct but fair
Provide specific questions for clarification
Flag misleading terms immediately
Always explain why something is concerning`
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

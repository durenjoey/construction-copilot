export interface ProjectStatus {
  id: string
  name: string
  description: string
  createdAt: string
  scope?: Scope
  proposal?: Proposal
  lessonsLearned?: LessonLearned[]
  chatHistory?: ChatMessage[]
}

export interface Scope {
  id: string
  content: string
  status: 'draft' | 'final'
  createdAt: string
  updatedAt: string
}

export interface Proposal {
  id: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  feedback?: string
  attachmentUrl?: string
  createdAt: string
  updatedAt: string
}

export interface LessonLearned {
  id: string
  title: string
  problem: string
  impact: {
    schedule: { affected: boolean, details: string }
    cost: { affected: boolean, details: string }
    quality: { affected: boolean, details: string }
    safety: { affected: boolean, details: string }
  }
  rootCause: string
  solution: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type: 'scope' | 'proposal' | 'lesson'
  attachments?: {
    url: string
    type: string
    name: string
  }[]
  timestamp: string
}

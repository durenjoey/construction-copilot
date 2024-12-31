export interface ProjectStatus {
  id: string
  name: string
  summary: string,
  clientComments: string,
  createdAt: string
  scope?: Scope
  proposal?: Proposal
  lessonsLearned?: LessonLearned[]
  chatHistory?: ChatMessage[]
  dailyReports?: DailyReport[]
  number?: string
  location?: string
}

// Serialized version for client-side use
export interface SerializedProjectStatus extends ProjectStatus {
  lessonsLearned?: (LessonLearned & { timestamp: string })[]
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

export interface Attachment {
  url: string
  type: string
  name: string
  content: string  // Added content property for storing attachment text content
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type: 'scope' | 'proposal'
  attachments?: Attachment[]
  timestamp: string
}

export interface DailyReport {
  id: string
  date: string
  summary: string
  clientComments: string
  weather: {
    type: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy'
    description: string
  }
  manpower: {
    id: number
    trade: string
    count: number
  }[]
  workAreas: {
    id: number
    description: string
  }[]
  photos: {
    id: number
    url: string
  }[]
  notes: string
  safety: string
  createdAt: string
  updatedAt: string
}

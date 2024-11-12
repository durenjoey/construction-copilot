'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore'
import { LessonLearned } from '@/lib/types'

interface LessonFormProps {
  projectId: string
}

type ImpactType = 'schedule' | 'cost' | 'quality' | 'safety'

export function LessonForm({ projectId }: LessonFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    problem: '',
    schedule: { affected: false, details: '' },
    cost: { affected: false, details: '' },
    quality: { affected: false, details: '' },
    safety: { affected: false, details: '' },
    rootCause: '',
    solution: ''
  })

  const revalidatePage = async () => {
    try {
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: `/dashboard/${projectId}/lessons`
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to revalidate page')
      }
      const data = await response.json()
      console.log('Revalidation response:', data)
    } catch (error) {
      console.error('Error revalidating:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) {
      console.error('No projectId provided')
      toast({
        title: 'Error',
        description: 'Project ID is missing',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Starting lesson submission for project:', projectId)
      
      const projectRef = doc(db, 'projects', projectId)
      
      // Check if document exists
      const docSnap = await getDoc(projectRef)
      if (!docSnap.exists()) {
        throw new Error('Project document does not exist')
      }

      const lesson: LessonLearned = {
        id: Date.now().toString(),
        title: formData.title,
        problem: formData.problem,
        impact: {
          schedule: formData.schedule,
          cost: formData.cost,
          quality: formData.quality,
          safety: formData.safety
        },
        rootCause: formData.rootCause,
        solution: formData.solution,
        createdAt: new Date().toISOString()
      }

      console.log('Created lesson object:', lesson)

      // Get current lessons array or initialize it
      const currentData = docSnap.data()
      const currentLessons = currentData?.lessonsLearned || []
      
      // Update document with new lesson
      await updateDoc(projectRef, {
        lessonsLearned: [...currentLessons, lesson]
      })

      console.log('Successfully updated Firestore')

      // Revalidate the page after successful update
      await revalidatePage()

      toast({
        title: 'Success',
        description: 'Lesson learned added successfully'
      })

      setOpen(false)
      setFormData({
        title: '',
        problem: '',
        schedule: { affected: false, details: '' },
        cost: { affected: false, details: '' },
        quality: { affected: false, details: '' },
        safety: { affected: false, details: '' },
        rootCause: '',
        solution: ''
      })
    } catch (error) {
      console.error('Error adding lesson:', error)
      if (error instanceof Error) {
        console.error('Error details:', error.message)
        console.error('Error stack:', error.stack)
      }
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add lesson learned',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImpactChange = (type: ImpactType, field: 'affected' | 'details', value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }))
  }

  const impactTypes: ImpactType[] = ['schedule', 'cost', 'quality', 'safety']

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Lesson</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Lesson Learned</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Clear, concise title describing the lesson"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="problem">Problem/Challenge Encountered</Label>
            <Textarea
              id="problem"
              placeholder="Describe the situation, issue, or challenge that led to this lesson"
              value={formData.problem}
              onChange={e => setFormData(prev => ({ ...prev, problem: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-4">
            <Label>Impact</Label>
            {impactTypes.map(type => (
              <div key={type} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${type}-impact`}
                    checked={formData[type].affected}
                    onCheckedChange={(checked: boolean) => handleImpactChange(type, 'affected', checked)}
                  />
                  <Label htmlFor={`${type}-impact`} className="capitalize">{type} Impact</Label>
                </div>
                {formData[type].affected && (
                  <Textarea
                    placeholder="Provide impact details"
                    value={formData[type].details}
                    onChange={e => handleImpactChange(type, 'details', e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rootCause">Root Cause</Label>
            <Textarea
              id="rootCause"
              placeholder="Identify the underlying cause(s) of the problem"
              value={formData.rootCause}
              onChange={e => setFormData(prev => ({ ...prev, rootCause: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="solution">Solution/Action Taken</Label>
            <Textarea
              id="solution"
              placeholder="Describe what was done to address the issue, including temporary and permanent solutions"
              value={formData.solution}
              onChange={e => setFormData(prev => ({ ...prev, solution: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Lesson'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

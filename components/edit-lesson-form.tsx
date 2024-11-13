'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { useToast } from '../hooks/use-toast'
import { db } from '../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { LessonLearned } from '../lib/types'

interface EditLessonFormProps {
  projectId: string
  lesson: LessonLearned
  trigger?: React.ReactNode
}

type ImpactType = 'schedule' | 'cost' | 'quality' | 'safety'

export function EditLessonForm({ projectId, lesson, trigger }: EditLessonFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: lesson.title,
    problem: lesson.problem,
    impact: {
      schedule: { affected: lesson.impact.schedule.affected, details: lesson.impact.schedule.details },
      cost: { affected: lesson.impact.cost.affected, details: lesson.impact.cost.details },
      quality: { affected: lesson.impact.quality.affected, details: lesson.impact.quality.details },
      safety: { affected: lesson.impact.safety.affected, details: lesson.impact.safety.details }
    },
    rootCause: lesson.rootCause,
    solution: lesson.solution
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
      const projectRef = doc(db, 'projects', projectId)
      
      // Check if document exists
      const docSnap = await getDoc(projectRef)
      if (!docSnap.exists()) {
        throw new Error('Project document does not exist')
      }

      const updatedLesson: LessonLearned = {
        ...lesson,
        title: formData.title,
        problem: formData.problem,
        impact: formData.impact,
        rootCause: formData.rootCause,
        solution: formData.solution
      }

      // Get current lessons array
      const currentData = docSnap.data()
      const currentLessons = currentData?.lessonsLearned || []
      
      // Replace the old lesson with the updated one
      const updatedLessons = currentLessons.map((l: LessonLearned) => 
        l.id === lesson.id ? updatedLesson : l
      )
      
      // Update document with modified lessons array
      await updateDoc(projectRef, {
        lessonsLearned: updatedLessons
      })

      // Revalidate the page after successful update
      await revalidatePage()

      toast({
        title: 'Success',
        description: 'Lesson learned updated successfully'
      })

      setOpen(false)
    } catch (error) {
      console.error('Error updating lesson:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update lesson learned',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImpactChange = (type: ImpactType, field: 'affected' | 'details', value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      impact: {
        ...prev.impact,
        [type]: {
          ...prev.impact[type],
          [field]: value
        }
      }
    }))
  }

  const impactTypes: ImpactType[] = ['schedule', 'cost', 'quality', 'safety']

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm">Edit</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lesson Learned</DialogTitle>
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
                    checked={formData.impact[type].affected}
                    onCheckedChange={(checked: boolean) => handleImpactChange(type, 'affected', checked)}
                  />
                  <Label htmlFor={`${type}-impact`} className="capitalize">{type} Impact</Label>
                </div>
                {formData.impact[type].affected && (
                  <Textarea
                    placeholder="Provide impact details"
                    value={formData.impact[type].details}
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createProject } from '@/lib/firebase'
import { useToast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Project description is required'),
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormProps {
  onSuccess: () => void
}

export function ProjectForm({ onSuccess }: ProjectFormProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  console.log('ProjectForm rendered with session:', session)
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Raw form submission triggered')
    
    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    
    console.log('Form data:', { name, description })

    if (!session?.user?.id) {
      console.error('No user ID found in session')
      toast({
        title: 'Error',
        description: 'You must be logged in to create a project',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      console.log('Attempting to create project...')
      console.log('Data:', { name, description })
      console.log('User ID:', session.user.id)
      
      const docRef = await createProject({ name, description }, session.user.id)
      console.log('Project created successfully with ID:', docRef.id)
      
      toast({
        title: 'Success',
        description: 'Project created successfully',
      })
      onSuccess()
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          name="name"
          placeholder="Project Name"
          className="w-full"
          disabled={isSubmitting}
          onChange={(e) => console.log('Name changed:', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Textarea
          name="description"
          placeholder="Project Description"
          className="w-full"
          disabled={isSubmitting}
          onChange={(e) => console.log('Description changed:', e.target.value)}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
        onClick={() => console.log('Submit button clicked')}
      >
        {isSubmitting ? 'Creating...' : 'Create Project'}
      </Button>
    </form>
  )
}

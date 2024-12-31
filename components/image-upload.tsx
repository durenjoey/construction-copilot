'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Camera, Loader2 } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface ImageUploadProps {
  onUploadComplete: (imageUrl: string) => void;
}

export function ImageUpload({ onUploadComplete }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Only image files are supported',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }

      const data = await response.json()
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      })

      onUploadComplete(data.url)
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      // Reset the input
      event.target.value = ''
    }
  }

  return (
    <div className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center hover:bg-gray-200">
      <input
        type="file"
        id="image-upload"
        className="hidden"
        onChange={handleUpload}
        accept="image/*"
        disabled={isUploading}
      />
      <label 
        htmlFor="image-upload" 
        className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-gray-600 mb-1" />
            <span className="text-sm text-gray-600">Uploading...</span>
          </>
        ) : (
          <>
            <Camera className="h-6 w-6 mb-1 text-gray-600" />
            <span className="text-sm text-gray-600">Add Photo</span>
          </>
        )}
      </label>
    </div>
  )
}

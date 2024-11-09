'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FileUploadProps {
  onUploadComplete?: (fileUrl: string, fileName: string, fileType: string) => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Only PDF and Word documents are supported',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload file')
      }

      const data = await response.json()
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      })

      if (onUploadComplete) {
        onUploadComplete(data.url, file.name, file.type)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      // Reset the input
      event.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleUpload}
        accept=".pdf,.doc,.docx"
        disabled={isUploading}
      />
      <label htmlFor="file-upload">
        <Button
          variant="outline"
          className="cursor-pointer"
          disabled={isUploading}
          asChild
        >
          <span>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </span>
        </Button>
      </label>
    </div>
  )
}

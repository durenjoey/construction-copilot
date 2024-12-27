"use client"

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidePanelProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function SidePanel({ title, children, className }: SidePanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn("relative", className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className={cn(
              "fixed right-4 z-40 rounded-full shadow-md hover:shadow-lg transition-all",
              isOpen ? "translate-x-[-320px]" : ""
            )}
          >
            {isOpen ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-80 p-0 bg-background"
        >
          <Card className="h-full rounded-none border-0">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              {children}
            </CardContent>
          </Card>
        </SheetContent>
      </Sheet>
    </div>
  )
}

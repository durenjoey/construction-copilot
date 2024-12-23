"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from 'components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Input } from 'components/ui/input';
import { Textarea } from 'components/ui/textarea';
import { Label } from 'components/ui/label';
import { FileUpload } from 'components/file-upload';
import { useToast } from 'hooks/use-toast';
import { FileText, ClipboardList, Lightbulb, Search, Filter, Plus, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SerializedProjectStatus } from 'lib/types';
import { LessonForm } from 'components/lesson-form';

interface ProjectTabsProps {
  project: SerializedProjectStatus;
  projectId: string;
}

export default function ProjectTabs({ project, projectId }: ProjectTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'scope');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string | null>(null);

  const tabs = [
    { id: 'scope', label: 'Scope', icon: FileText },
    { id: 'proposal', label: 'Proposal', icon: ClipboardList },
    { id: 'lessons', label: 'Lessons', icon: Lightbulb }
  ];

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const filterLessons = () => {
    if (!project?.lessonsLearned?.length) return [];
    
    return project.lessonsLearned
      .filter(lesson => {
        if (!lesson) return false;
        
        const matchesSearch = searchQuery === '' || 
          lesson.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lesson.problem?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lesson.solution?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDate = !dateFilter || 
          lesson.timestamp.split('T')[0] === dateFilter;
        
        return matchesSearch && matchesDate;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'scope':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Project Scope</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project?.scope?.content || 'No scope defined yet. Click to start defining the project scope.'}
              </p>
              <Button className="mt-4" asChild>
                <Link href={`/dashboard/${projectId}/chat?tab=scope`}>
                  <FileText className="mr-2 h-4 w-4" />
                  {project?.scope?.content ? 'Continue Scope Discussion' : 'Start Scope'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        );

      case 'proposal':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Project Proposal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project?.proposal?.content || 'No proposal created yet. Click to start creating a proposal.'}
              </p>
              <Button className="mt-4" asChild>
                <Link href={`/dashboard/${projectId}/chat?tab=proposal`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  {project?.proposal?.content ? 'Continue Proposal Discussion' : 'Create Proposal'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        );

      case 'lessons':
        const filteredLessons = filterLessons();
        return (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
              <Input
                type="date"
                value={dateFilter || ''}
                onChange={(e) => setDateFilter(e.target.value || null)}
                className="w-40"
              />
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setDateFilter(null);
              }}>
                Clear Filters
              </Button>
              <LessonForm projectId={projectId} />
            </div>

            {filteredLessons.length > 0 ? (
              filteredLessons.map((lesson) => (
                <Card key={lesson.id}>
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <h3 className="font-medium">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(lesson.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Problem</h4>
                        <p className="text-sm text-muted-foreground">{lesson.problem}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Solution</h4>
                        <p className="text-sm text-muted-foreground">{lesson.solution}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Lightbulb className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No Lessons Found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery || dateFilter ? 'Try adjusting your filters' : 'Share knowledge to improve future projects'}
                  </p>
                  <LessonForm projectId={projectId} />
                </CardContent>
              </Card>
            )}
          </div>
        );
    }
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{project?.name || 'Untitled Project'}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <span>{project?.number}</span>
          <span>•</span>
          <span>{project?.location}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={`/dashboard/${projectId}?tab=${tab.id}`}
                className={`
                  flex items-center gap-2 px-4 py-2 border-b-2 
                  ${activeTab === tab.id 
                    ? 'border-blue-500 text-blue-500' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
}

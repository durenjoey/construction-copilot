'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Send, Plus, X, Cloud, Sun, CloudRain, CloudLightning } from 'lucide-react';
import { Card, CardContent } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Textarea } from 'components/ui/textarea';
import { Alert, AlertDescription } from 'components/ui/alert';
import { useToast } from 'hooks/use-toast';
import { ImageUpload } from 'components/image-upload';
import { DailyReport } from 'lib/types';

interface Worker {
  id: number;
  trade: string;
  count: number;
}

interface WorkArea {
  id: number;
  description: string;
}

interface Photo {
  id: number;
  url: string;
}

interface Weather {
  type: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
  description: string;
}

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  placeholder: string;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

interface DailyReportFormProps {
  reportId?: string;
}

const commonTrades = [
  'Carpenter',
  'Electrician',
  'Plumber',
  'HVAC',
  'Iron Worker',
  'Mason',
  'Drywall',
  'Painter',
  'Roofer',
  'Concrete',
  'Equipment Operator',
  'Glazier',
  'Insulator',
  'Laborer',
  'Sheet Metal',
  'Tile Setter',
  'Waterproofer',
  'Welder',
  'Superintendent',
  'Project Manager'
];

const weatherTypes = [
  { icon: <Sun className="h-5 w-5" />, label: 'Sunny' },
  { icon: <Cloud className="h-5 w-5" />, label: 'Cloudy' },
  { icon: <CloudRain className="h-5 w-5" />, label: 'Rainy' },
  { icon: <CloudLightning className="h-5 w-5" />, label: 'Stormy' }
] as const;

const ComboboxInput: React.FC<ComboboxInputProps> = ({ value, onChange, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTrades = commonTrades.filter(trade => 
    trade.toLowerCase().includes((search || value).toLowerCase())
  );

  return (
    <div className="relative">
      <Input
        value={value || search}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className={`w-full ${value ? 'bg-blue-50 border-blue-200' : ''}`}
      />
      {isOpen && (search || filteredTrades.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-auto">
          {search && !filteredTrades.includes(search) && (
            <button
              className="w-full px-4 py-2 text-left hover:bg-blue-50 text-blue-600"
              onClick={() => {
                onSelect(search);
                setIsOpen(false);
              }}
            >
              Add &quot;{search}&quot;
            </button>
          )}
          {filteredTrades.map(trade => (
            <button
              key={trade}
              className="w-full px-4 py-2 text-left hover:bg-gray-50"
              onClick={() => {
                onSelect(trade);
                setIsOpen(false);
              }}
            >
              {trade}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <Card className="bg-white">
    <CardContent className="p-4 space-y-4">
      <Label className="text-lg font-medium">{title}</Label>
      {children}
    </CardContent>
  </Card>
);

export const DailyReportForm: React.FC<DailyReportFormProps> = ({ reportId }): JSX.Element => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.projectId as string;

  const [manpower, setManpower] = useState<Worker[]>([]);
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState('');
  const [safety, setSafety] = useState('');
  const [weather, setWeather] = useState<Weather | { type: ''; description: string }>({
    type: '',
    description: ''
  });
  const [customTrade, setCustomTrade] = useState('');
  const [customCount, setCustomCount] = useState('');
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [clientComments, setClientComments] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project');
        }
        const projectData = await projectResponse.json();
        setProjectTitle(projectData.name);

        // Fetch report if editing
        if (reportId) {
          const reportResponse = await fetch(`/api/daily-reports/${reportId}?projectId=${projectId}`);
          if (!reportResponse.ok) {
            throw new Error('Failed to fetch report');
          }
          const data = await reportResponse.json();
          
          setManpower(data.manpower || []);
          setWorkAreas(data.workAreas || []);
          setPhotos(data.photos || []);
          setNotes(data.notes || '');
          setSafety(data.safety || '');
          setWeather(data.weather || { type: '', description: '' });
          setSummary(data.summary || '');
          setClientComments(data.clientComments || '');
          // Convert UTC date to local date for input
          const date = new Date(data.date);
          setReportDate(date.toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error instanceof Error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load data. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId, projectId, toast]);

  const [selectedTrade, setSelectedTrade] = useState('');

  const addTrade = (tradeName: string) => {
    setSelectedTrade(tradeName);
    setCustomTrade(tradeName);
    if (customCount) {
      setManpower([...manpower, {
        id: Date.now(),
        trade: tradeName,
        count: parseInt(customCount)
      }]);
      setSelectedTrade('');
      setCustomTrade('');
      setCustomCount('');
    }
  };

  const handleCountChange = (count: string) => {
    setCustomCount(count);
    if (selectedTrade && count) {
      setManpower([...manpower, {
        id: Date.now(),
        trade: selectedTrade,
        count: parseInt(count)
      }]);
      setSelectedTrade('');
      setCustomTrade('');
      setCustomCount('');
    }
  };

  const addWorkArea = () => {
    setWorkAreas([...workAreas, {
      id: Date.now(),
      description: ''
    }]);
  };

  const handlePhotoUpload = (imageUrl: string) => {
    try {
      // Validate URL format
      new URL(imageUrl);
      
      const newPhoto = {
        id: Date.now(),
        url: imageUrl
      };
      
      setPhotos(prevPhotos => {
        const updatedPhotos = [...prevPhotos, newPhoto];
        return updatedPhotos.slice(0, 6); // Keep max 6 photos
      });
    } catch (error) {
      console.error('Invalid photo URL:', error);
      toast({
        title: "Error",
        description: "Failed to add photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!weather.type) {
      toast({
        title: "Weather Required",
        description: "Please select a weather condition.",
        variant: "destructive",
      });
      return;
    }

    // Validate photos
    if (photos.some(photo => {
      try {
        new URL(photo.url);
        return false;
      } catch {
        return true;
      }
    })) {
      toast({
        title: "Invalid Photos",
        description: "One or more photo URLs are invalid",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = reportId 
        ? `/api/daily-reports/${reportId}?projectId=${projectId}`
        : `/api/daily-reports?projectId=${projectId}`;
      
      const method = reportId ? 'PUT' : 'POST';

      // Convert date to ISO string with time set to start of day in UTC
      const [year, month, day] = reportDate.split('-').map(Number);
      const dateISO = new Date(Date.UTC(year, month - 1, day)).toISOString();

      // Ensure weather type is one of the valid types
      const validatedWeather: Weather = {
        type: weather.type as Weather['type'],
        description: weather.description
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateISO,
          summary,
          clientComments,
          weather: validatedWeather,
          manpower,
          workAreas,
          photos: photos.map(photo => ({
            id: photo.id,
            url: photo.url
          })),
          notes,
          safety,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || `Failed to ${reportId ? 'update' : 'submit'} daily report`);
      }

      const updatedReport = await response.json();
      
      toast({
        title: "Success",
        description: `Daily report ${reportId ? 'updated' : 'submitted'} successfully`,
      });

      router.push(`/dashboard/${projectId}/daily-reports`);
    } catch (error) {
      console.error('Error submitting daily report:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${reportId ? 'update' : 'submit'} daily report. Please try again.`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  const totalWorkers = manpower.reduce((sum, { count }) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-4">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold">Daily Report: {projectTitle}</h1>
            <div className="flex gap-3">
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-32"
              />
              <Input
                type="text"
                placeholder="Daily Summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {weatherTypes.map(({ icon, label }) => (
                <Button
                  key={label}
                  variant={weather.type === label ? "default" : "outline"}
                  size="lg"
                  className="flex-1"
                  onClick={() => setWeather({ ...weather, type: label as Weather['type'] })}
                >
                  {icon}
                  <span className="ml-2">{label}</span>
                </Button>
              ))}
            </div>
            <Textarea
              value={weather.description}
              onChange={(e) => setWeather({ ...weather, description: e.target.value })}
              placeholder="Additional weather details..."
              className="min-h-[60px]"
            />
          </div>
        </div>
      </div>

      {/* Worker Total Banner */}
      {totalWorkers > 0 && (
        <div className="sticky top-[185px] z-10 bg-blue-50 border-b">
          <div className="max-w-2xl mx-auto px-4 py-2 flex justify-between items-center">
            <span className="text-sm text-blue-700">Total Workers</span>
            <span className="text-xl font-bold text-blue-700">{totalWorkers}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Section title="Manpower">
          <div className="flex gap-2">
            <div className="flex-grow">
              <ComboboxInput
                value={customTrade}
                onChange={setCustomTrade}
                onSelect={addTrade}
                placeholder="Select or type trade name..."
              />
            </div>
            <Input
              type="number"
              placeholder="#"
              value={customCount}
              onChange={(e) => handleCountChange(e.target.value)}
              className="w-16"
            />
            <Button onClick={() => addTrade(customTrade)}>Add</Button>
          </div>
          
          <div className="space-y-2">
            {manpower.map((worker) => (
              <Card key={worker.id} className="bg-gray-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{worker.trade}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold">{worker.count}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setManpower(manpower.filter(m => m.id !== worker.id))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Work Areas">
          {workAreas.map((area, index) => (
            <Card key={area.id} className="bg-gray-50 mb-2">
              <CardContent className="p-3">
                <Textarea
                  value={area.description}
                  onChange={(e) => {
                    const newAreas = [...workAreas];
                    newAreas[index] = { ...area, description: e.target.value };
                    setWorkAreas(newAreas);
                  }}
                  placeholder="Describe the work area and progress..."
                  className="w-full"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setWorkAreas(workAreas.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={addWorkArea} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Work Area
          </Button>
        </Section>

        <Section title="Photos">
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square bg-gray-100 rounded-lg">
                <Image 
                  src={photo.url}
                  alt="site progress"
                  className="w-full h-full object-cover rounded-lg"
                  width={200}
                  height={200}
                  unoptimized
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 rounded-full"
                  onClick={() => setPhotos(photos.filter(p => p.id !== photo.id))}
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>
            ))}
            {photos.length < 6 && (
              <ImageUpload onUploadComplete={handlePhotoUpload} />
            )}
          </div>
        </Section>

        <Section title="Notes">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any delays, issues, or general notes..."
            className="w-full"
          />
        </Section>

        <Section title="Safety">
          <Alert className="bg-red-50 mb-3">
            <AlertDescription>
              Report any safety incidents or concerns.
            </AlertDescription>
          </Alert>
          <Textarea
            value={safety}
            onChange={(e) => setSafety(e.target.value)}
            placeholder="Describe any safety incidents or concerns..."
            className="w-full"
          />
        </Section>

        <Section title="Client Comments">
          <Alert className="bg-blue-50 mb-3">
            <AlertDescription>
              Record any comments or requests from the client that may affect project scope.
            </AlertDescription>
          </Alert>
          <Textarea
            value={clientComments}
            onChange={(e) => setClientComments(e.target.value)}
            placeholder="Document client feedback, requests, or concerns..."
            className="w-full"
          />
        </Section>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-2xl mx-auto p-4">
          <Button className="w-full" size="lg" onClick={handleSubmit}>
            <Send className="h-4 w-4 mr-2" />
            {reportId ? 'Update Report' : 'Submit Report'}
          </Button>
        </div>
      </div>
    </div>
  );
};

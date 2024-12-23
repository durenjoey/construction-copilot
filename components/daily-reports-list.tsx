'use client';

import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, ChevronDown, ChevronRight, Users, Sun, CloudRain, Cloud } from 'lucide-react';
import { Card, CardContent } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { useToast } from 'hooks/use-toast';
import Link from 'next/link';
import { DailyReport } from 'lib/types';

interface DailyReportsListProps {
  projectId: string;
}

const WeatherIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type.toLowerCase()) {
    case 'sunny':
      return <Sun className="h-4 w-4 text-yellow-500" />;
    case 'rainy':
      return <CloudRain className="h-4 w-4 text-blue-500" />;
    case 'stormy':
      return <CloudRain className="h-4 w-4 text-purple-500" />;
    default:
      return <Cloud className="h-4 w-4 text-gray-500" />;
  }
};

export const DailyReportsList: React.FC<DailyReportsListProps> = ({ projectId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch(`/api/daily-reports?projectId=${projectId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch daily reports');
        }
        const data = await response.json();
        setReports(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching daily reports:', error);
        setError('Failed to load daily reports');
        toast({
          title: "Error",
          description: "Failed to load daily reports. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [projectId, toast]);

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm
      ? (report.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (report.workAreas?.some(area => 
          area.description.toLowerCase().includes(searchTerm.toLowerCase())
        ) || false) ||
        (report.manpower?.some(trade =>
          trade.trade.toLowerCase().includes(searchTerm.toLowerCase())
        ) || false)
      : true;

    const reportDate = new Date(report.date);
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;

    const matchesDateRange = 
      (!startDate || reportDate >= startDate) &&
      (!endDate || reportDate <= endDate);

    return matchesSearch && matchesDateRange;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="font-medium mb-2 text-destructive">{error}</h3>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Filters */}
      <div className="bg-white border-b mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-grow max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search daily reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-32"
            />
            <span className="text-gray-400">to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-32"
            />
          </div>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setDateRange({ start: '', end: '' });
          }}>
            Clear Filters
          </Button>

          <Button asChild>
            <Link href={`/dashboard/${projectId}/daily-reports/new`}>
              + New Daily Report
            </Link>
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map((report) => (
          <Link 
            key={report.id} 
            href={`/dashboard/${projectId}/daily-reports/${report.id}`}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-500">
                      {new Date(report.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                          {report.manpower?.reduce((sum, { count }) => sum + (count || 0), 0) || 0} Workers
                        </span>
                      </div>
                      <WeatherIcon type={report.weather?.type || 'cloudy'} />
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {report.workAreas?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Work Areas</h4>
                    <div className="space-y-2">
                      {report.workAreas.map((area) => (
                        <p key={area.id} className="text-sm text-gray-600 line-clamp-1">
                          {area.description}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {report.manpower?.map((trade) => (
                    <div key={trade.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {trade.trade} ({trade.count})
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="font-medium mb-2">No Daily Reports Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {reports.length === 0
                ? "Start tracking your project's daily progress"
                : "No reports match your search criteria"}
            </p>
            {reports.length === 0 && (
              <Button asChild>
                <Link href={`/dashboard/${projectId}/daily-reports/new`}>
                  Create First Report
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

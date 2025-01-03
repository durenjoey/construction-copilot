'use client';

import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, ChevronDown, ChevronRight, Users, Sun, CloudRain, Cloud, MessageSquare } from 'lucide-react';
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
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch daily reports');
        }
        const data = await response.json();
        setReports(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching daily reports:', error);
        setError(error instanceof Error ? error.message : 'Failed to load daily reports');
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load daily reports. Please try again.",
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
      ? (report.summary?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (report.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (report.clientComments?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
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
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(report.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                      <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-700">
                          {String(report.manpower?.reduce((sum, { count }) => sum + count, 0) || 0).padStart(2, '0')} Workers
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <WeatherIcon type={report.weather?.type || 'cloudy'} />
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {report.weather?.type || 'Cloudy'}
                        </span>
                      </div>
                      {report.clientComments && (
                        <div className="flex items-center text-blue-600">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 mt-2" />
                </div>

                {report.summary && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Summary</h4>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {report.summary}
                    </p>
                  </div>
                )}

                {report.workAreas?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Work Areas</h4>
                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                      {report.workAreas.map((area) => (
                        <p key={area.id} className="text-sm text-gray-700 line-clamp-1">
                          • {area.description}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Trades</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.manpower?.map((trade) => (
                      <div 
                        key={trade.id} 
                        className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium"
                      >
                        {trade.trade} ({trade.count})
                      </div>
                    ))}
                  </div>
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

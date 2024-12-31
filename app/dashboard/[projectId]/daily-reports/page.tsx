'use client';

import { DailyReportsList } from 'components/daily-reports-list';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'components/error-boundary';

function DailyReportsContent() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="bg-white border-b mb-6">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Daily Reports</h1>
              <div className="text-sm text-gray-500">Track daily progress and activities</div>
            </div>
          </div>
        </div>
      </div>
      <DailyReportsList projectId={projectId} />
    </div>
  );
}

export default function DailyReportsPage() {
  return (
    <ErrorBoundary>
      <DailyReportsContent />
    </ErrorBoundary>
  );
}

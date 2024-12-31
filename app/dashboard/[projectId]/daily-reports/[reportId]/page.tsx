'use client';

import { DailyReportForm } from 'components/daily-report-form';
import { Button } from 'components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'components/error-boundary';

function DailyReportContent() {
  const params = useParams();
  const projectId = params.projectId as string;
  const reportId = params.reportId as string;
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
      <Button 
        variant="ghost" 
        asChild
        className="mb-6"
      >
        <Link href={`/dashboard/${projectId}/daily-reports`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Link>
      </Button>
      <DailyReportForm reportId={reportId} />
    </div>
  );
}

export default function DailyReportPage() {
  return (
    <ErrorBoundary>
      <DailyReportContent />
    </ErrorBoundary>
  );
}

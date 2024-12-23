'use client';

import { DailyReportForm } from 'components/daily-report-form';
import { Button } from 'components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function DailyReportPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const reportId = params.reportId as string;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          asChild
          className="mb-4"
        >
          <Link href={`/dashboard/${projectId}/daily-reports`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Daily Report Details</h1>
      </div>
      <DailyReportForm reportId={reportId} />
    </div>
  );
}

'use client';

import { DailyReportForm } from 'components/daily-report-form';
import { Button } from 'components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function NewDailyReportPage() {
  const params = useParams();
  const projectId = params.projectId as string;

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
      <DailyReportForm />
    </div>
  );
}

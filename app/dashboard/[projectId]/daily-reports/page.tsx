'use client';

import { DailyReportsList } from 'components/daily-reports-list';
import { useParams } from 'next/navigation';

export default function DailyReportsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

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

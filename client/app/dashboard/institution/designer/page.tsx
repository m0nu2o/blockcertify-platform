"use client";

import { DashboardShell } from '@/components/dashboard-shell';
import { TemplateDesigner } from '@/components/dashboard/template-designer';

export default function InstitutionDesignerPage() {
  return (
    <DashboardShell title="Certificate Template Designer">
      <div className="space-y-2">
        <TemplateDesigner />
      </div>
    </DashboardShell>
  );
}

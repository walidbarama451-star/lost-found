import { apiRequest } from '@/shared/api/client';
import type { LostReport, LostReportStatus, Pagination } from '@/shared/api/types';

export interface LostReportsQuery {
  status?: LostReportStatus | '';
  page?: number;
  limit?: number;
}

export interface LostReportListResult {
  reports: LostReport[];
  pagination: Pagination;
}

export async function createLostReport(form: FormData): Promise<LostReport> {
  const data = await apiRequest<{ report: LostReport }>('/lost-reports', {
    method: 'POST',
    formData: form,
  });
  return data.report;
}

export async function listMyReports(
  query: LostReportsQuery = {},
): Promise<LostReportListResult> {
  return apiRequest<LostReportListResult>('/lost-reports', { query: { ...query } });
}

export async function getLostReport(reportId: string): Promise<LostReport> {
  const data = await apiRequest<{ report: LostReport }>(`/lost-reports/${reportId}`);
  return data.report;
}

export async function searchLostReport(reportId: string): Promise<LostReport> {
  const data = await apiRequest<{ report: LostReport }>(`/lost-reports/${reportId}/search`, {
    method: 'POST',
  });
  return data.report;
}

export interface LostReportPatch {
  title?: string;
  status?: LostReportStatus;
}

export async function updateLostReport(
  reportId: string,
  patch: LostReportPatch,
): Promise<LostReport> {
  const data = await apiRequest<{ report: LostReport }>(`/lost-reports/${reportId}`, {
    method: 'PATCH',
    body: patch,
  });
  return data.report;
}

export async function deleteLostReport(reportId: string): Promise<void> {
  await apiRequest<{ deleted: boolean }>(`/lost-reports/${reportId}`, { method: 'DELETE' });
}

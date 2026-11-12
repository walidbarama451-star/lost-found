/** Lost-report API calls: the "I lost something" photo search flow. */

import { apiRequest } from '../../lib/api';
import type { LostReport, LostReportStatus, Pagination } from '../../types';

export interface LostReportsQuery {
  status?: LostReportStatus | '';
  page?: number;
  limit?: number;
}

/** The backend names this collection `reports` rather than `items`. */
export interface LostReportListResult {
  reports: LostReport[];
  pagination: Pagination;
}

/** Multipart create — text fields + up to 3 photos under `images`. */
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

/** Re-runs the photo search so new found items can appear. */
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

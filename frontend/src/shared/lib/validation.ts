import { ZodError, type ZodIssue, type ZodTypeAny } from 'zod';
import { ApiError } from '@/shared/api/client';

function issueToEntry(issue: ZodIssue): { field: string; message: string } {
  const field = issue.path.length > 0 ? issue.path.join('.') : '_form';
  return { field, message: issue.message };
}

export function zodFieldErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const entry = issueToEntry(issue);
    if (result[entry.field] === undefined) {
      result[entry.field] = entry.message;
    }
  }
  return result;
}

export type ValidateResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: Record<string, string>; message: string };

export function validateWith<T>(schema: ZodTypeAny, input: unknown): ValidateResult<T> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data as T };
  const fieldErrors = zodFieldErrors(result.error);
  const first = Object.values(fieldErrors)[0];
  return { ok: false, fieldErrors, message: first ?? 'Please fix the highlighted fields.' };
}

export function toDisplayError(error: unknown): {
  message: string;
  fieldErrors: Record<string, string>;
} {
  if (error instanceof ApiError) {
    return { message: error.message, fieldErrors: error.fieldErrors() };
  }
  if (error instanceof Error) {
    return { message: error.message, fieldErrors: {} };
  }
  return { message: 'Something went wrong. Please try again.', fieldErrors: {} };
}

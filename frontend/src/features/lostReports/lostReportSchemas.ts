import { z } from 'zod';

export const lostReportSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
});

export type LostReportFormValues = {
  title: string;
};

export const emptyLostReportValues: LostReportFormValues = {
  title: '',
};

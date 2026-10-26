import { z } from 'zod';

export const AnalysisSchema = z.object({
  score: z.number().finite().min(0).max(100).describe('Score from 0 to 100'),
  skillsFound: z.array(z.string().trim().min(1).max(100)).max(80),
  skillsMissing: z.array(z.string().trim().min(1).max(100)).max(80),
  topFixes: z.array(z.string().trim().min(1).max(500)).length(3)
});

import { z } from 'zod';
export const AnalysisSchema = z.object({ score: z.number().describe('Whole number from 0 to 100'), skillsFound: z.array(z.string()), skillsMissing: z.array(z.string()), topFixes: z.array(z.string()).length(3) });

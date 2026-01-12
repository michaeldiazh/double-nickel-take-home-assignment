import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { JobRepository } from '../../entities/job/repository';
import { Job } from '../../entities/job/domain';

/**
 * Zod schema for job response
 */
const jobResponseSchema = z.object({
  jobName: z.string(),
  jobDescription: z.string(),
  jobLocation: z.string(),
  isActive: z.boolean(),
});

type JobResponse = z.infer<typeof jobResponseSchema>;

/**
 * Zod schema for jobs list response
 */
const jobsListResponseSchema = z.array(jobResponseSchema);

/**
 * Build job response from Job entity
 */
const buildJobResponse = (job: Job): JobResponse => {
  return {
    jobName: job.name,
    jobDescription: job.description,
    jobLocation: job.location || '',
    isActive: job.is_active ?? true,
  };
};

/**
 * Create job routes
 */
export const createJobRoutes = (pool: Pool): Router => {
  const router = Router();
  const jobRepo = new JobRepository(pool);

  /**
   * GET /jobs - Get all jobs ordered by created_at ascending
   */
  router.get('/jobs', async (req: Request, res: Response) => {
    try {
      const jobs = await jobRepo.getAll();

      // Map to response format
      const jobResponses: JobResponse[] = jobs.map(buildJobResponse);

      // Validate entire response array
      const response = jobsListResponseSchema.parse(jobResponses);

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      if (error instanceof z.ZodError) {
        return res.status(500).json({ error: 'Data validation error', details: error.issues });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};

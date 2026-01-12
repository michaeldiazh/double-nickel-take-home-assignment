import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { UserRepository } from '../../entities/user/repository';
import { ApplicationService } from '../../services/application/service';
import { ScreeningDecision, screeningDecisionSchema } from '../../entities';

/**
 * Zod schema for POST /user request body
 */
export const createUserRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(), // Not used, but included for API consistency
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address: z.string().min(1),
  aptNum: z.string().optional(),
  state: z.string().min(1),
  zipCode: z.string().min(1),
});

type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

/**
 * Zod schema for POST /user/login request body
 */
export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * Zod schema for job application with screening decision
 */
const jobApplicationSchema = z.object({
  jobName: z.string(),
  jobDescription: z.string(),
  jobLocation: z.string(),
  screeningDecision: screeningDecisionSchema,
});

type JobApplication = z.infer<typeof jobApplicationSchema>;

/**
 * Zod schema for user response
 */
const userResponseSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  address: z.string(),
  aptNum: z.string().optional(),
  state: z.string(),
  zipCode: z.string(),
  jobApplications: z.array(jobApplicationSchema),
});

type UserResponse = z.infer<typeof userResponseSchema>;

/**
 * Get user with job applications
 */
const getUserWithApplications = async (
  userId: string,
  userRepo: UserRepository,
  applicationService: ApplicationService
): Promise<UserResponse | null> => {
  const user = await userRepo.getById(userId);
  if (!user) return null;

  // Get all applications for this user with job and conversation data
  const applications = await applicationService.getApplicationsWithJobAndConversationByUserId(userId);

  // Map to job applications with Zod validation
  const jobApplications: JobApplication[] = applications.map((app) => {
    const jobApp = {
      jobName: app.job_name,
      jobDescription: app.job_description,
      jobLocation: app.job_location || '',
      screeningDecision: app.screening_decision || ScreeningDecision.PENDING,
    };
    return jobApplicationSchema.parse(jobApp);
  });

  // Build response with Zod validation
  const response = {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    address: user.address || '',
    aptNum: user.apt_num || undefined,
    state: user.state || '',
    zipCode: user.zip_code || '',
    jobApplications,
  };

  return userResponseSchema.parse(response);
};

/**
 * Create user routes
 */
export const createUserRoutes = (pool: Pool): Router => {
  const router = Router();
  const userRepo = new UserRepository(pool);
  const applicationService = new ApplicationService(pool);

  /**
   * POST /user - Create a new user
   */
  router.post('/user', async (req: Request, res: Response) => {
    try {
      // Validate request body with Zod
      const parseResult = createUserRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: parseResult.error.issues 
        });
      }

      const body = parseResult.data;

      // Check if user already exists
      const existingUser = await userRepo.getByEmail(body.email);
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // Create user
      const userId = await userRepo.create({
        email: body.email,
        first_name: body.firstName,
        last_name: body.lastName,
        address: body.address,
        apt_num: body.aptNum,
        state: body.state,
        zip_code: body.zipCode,
      });

      // Get user with applications
      const userResponse = await getUserWithApplications(userId, userRepo, applicationService);

      if (!userResponse) {
        return res.status(500).json({ error: 'Failed to retrieve created user' });
      }

      return res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * POST /user/login - Authenticate a user
   */
  router.post('/user/login', async (req: Request, res: Response) => {
    try {
      // Validate request body with Zod
      const parseResult = loginRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: parseResult.error.issues 
        });
      }

      const body = parseResult.data;

      // Find user by email
      const user = await userRepo.getByEmail(body.email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Get user with applications
      const userResponse = await getUserWithApplications(user.id, userRepo, applicationService);

      if (!userResponse) {
        return res.status(500).json({ error: 'Failed to retrieve user data' });
      }

      return res.status(200).json(userResponse);
    } catch (error) {
      console.error('Error logging in user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};

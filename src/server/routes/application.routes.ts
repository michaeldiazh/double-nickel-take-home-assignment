import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { ApplicationRepository } from '../../entities/application/repository';
import {ConversationRepository} from "../../entities";

/**
 * Create application routes
 */
export const createApplicationRoutes = (pool: Pool): Router => {
  const router = Router();
  const applicationRepo = new ApplicationRepository(pool);
  const conversationRepo = new ConversationRepository(pool)
  router.get('/applications/:applicationId/conversation', async (req: Request, res: Response) => {
      const conversation = await conversationRepo.getByApplicationId(req.params.applicationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        return  res.status(200).json(conversation);
  });
  /**
   * DELETE /application/:applicationId - Delete an application
   * This will cascade delete the conversation and all related data.
   */
  router.delete('/application/:applicationId', async (req: Request, res: Response) => {
    try {
      const { applicationId } = req.params;

      // Validate UUID format
      const uuidSchema = z.uuidv4();
      const validatedApplicationId = uuidSchema.parse(applicationId);

      // Delete the application (cascades to conversation and related data)
      const deleted = await applicationRepo.delete(validatedApplicationId);

      if (!deleted) {
        return res.status(404).json({ error: 'Application not found' });
      }

      return res.status(200).json({ message: 'Application deleted successfully' });
    } catch (error) {
      console.error('Error deleting application:', error);
      if (error instanceof z.ZodError) {
        // UUID validation errors should return 400
        return res.status(400).json({ error: 'Invalid application ID format (must be UUID v4)' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { ConversationRepository } from '../../entities/conversation/repository';
import { ApplicationRepository } from '../../entities/application/repository';
import { MessageRepository } from '../../entities/message/repository';
import { ScreeningDecision } from '../../entities';

/**
 * Zod schema for conversation summary response
 */
const conversationSummaryResponseSchema = z.object({
  summaryStatus: z.enum(['Approved', 'Denied', 'Pending', 'Canceled']),
});

type ConversationSummaryResponse = z.infer<typeof conversationSummaryResponseSchema>;

/**
 * Messages data interface
 */
interface MessagesData {
  application: {
    user_first_name: string;
    user_last_name: string;
  };
  conversation: {
    id: string;
  };
  messages: Array<{ sender: string; content: string; created_at: Date }>;
}

/**
 * Record mapping ScreeningDecision enum to summary status string
 */
const SCREENING_DECISION_TO_SUMMARY_STATUS: Record<ScreeningDecision, 'Approved' | 'Denied' | 'Pending' | 'Canceled'> = {
  [ScreeningDecision.APPROVED]: 'Approved',
  [ScreeningDecision.DENIED]: 'Denied',
  [ScreeningDecision.PENDING]: 'Pending',
  [ScreeningDecision.USER_CANCELED]: 'Canceled',
};

/**
 * Map ScreeningDecision enum to summary status string
 */
const mapScreeningDecisionToSummaryStatus = (decision: ScreeningDecision): 'Approved' | 'Denied' | 'Pending' | 'Canceled' => {
  return SCREENING_DECISION_TO_SUMMARY_STATUS[decision] ?? 'Pending';
};

/**
 * Format messages into a text file content
 */
const formatMessagesAsText = (messages: Array<{ sender: string; content: string; created_at: Date }>): string => {
  return messages
    .map((msg) => {
      const timestamp = msg.created_at.toISOString();
      const senderLabel = msg.sender === 'USER' ? 'User' : msg.sender === 'ASSISTANT' ? 'Assistant' : 'System';
      return `[${timestamp}] ${senderLabel}: ${msg.content}`;
    })
    .join('\n\n');
};

/**
 * Build filename for message download: <first_name>_<last_name>_<application-id>.txt
 */
const buildMessageFilename = (firstName: string, lastName: string, applicationId: string): string => {
  const sanitizedFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedLastName = lastName.replace(/[^a-zA-Z0-9]/g, '_');
  return `${sanitizedFirstName}_${sanitizedLastName}_${applicationId}.txt`;
};

/**
 * Set HTTP headers for file download
 */
const setDownloadHeaders = (res: Response, filename: string, content: string): void => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
};

/**
 * Get messages data for an application
 */
const getMessagesData = async (
  applicationId: string,
  applicationRepo: ApplicationRepository,
  conversationRepo: ConversationRepository,
  messageRepo: MessageRepository
): Promise<MessagesData | null> => {
  // Get application with user info to get first_name and last_name
  const application = await applicationRepo.getWithUserAndJob(applicationId);
  if (!application) {
    return null;
  }

  // Get conversation by application ID
  const conversation = await conversationRepo.getByApplicationId(applicationId);
  if (!conversation) {
    return null;
  }

  // Get all messages for the conversation
  const messages = await messageRepo.getByConversationId(conversation.id);

  return {
    application: {
      user_first_name: application.user_first_name as string,
      user_last_name: application.user_last_name as string,
    },
    conversation: {
      id: conversation.id,
    },
    messages,
  };
};

/**
 * Create conversation summary routes
 */
export const createConversationSummaryRoutes = (pool: Pool): Router => {
  const router = Router();
  const conversationRepo = new ConversationRepository(pool);
  const applicationRepo = new ApplicationRepository(pool);
  const messageRepo = new MessageRepository(pool);

  // Note: GET /conversation-summary/:applicationId endpoint has been removed.
  // The frontend should get screening decision and summary from:
  // 1. WebSocket messages (when conversationComplete is true)
  // 2. GET /conversation-summary/:applicationId/messages (for message download)
  // 3. Conversation requirements endpoint (for detailed requirement status)

  /**
   * GET /conversation-summary/:applicationId/messages - Download messages as text file
   */
  router.get('/conversation-summary/:applicationId/messages', async (req: Request, res: Response) => {
    try {
      const { applicationId } = req.params;

      // Validate UUID format
      const uuidSchema = z.uuidv4();
      const validatedApplicationId = uuidSchema.parse(applicationId);

      // Get messages data
      const messagesData = await getMessagesData(
        validatedApplicationId,
        applicationRepo,
        conversationRepo,
        messageRepo
      );

      if (!messagesData) {
        // Determine which resource was not found
        const application = await applicationRepo.getWithUserAndJob(validatedApplicationId);
        if (!application) {
          return res.status(404).json({ error: 'Application not found' });
        }
        return res.status(404).json({ error: 'Conversation not found for this application' });
      }

      // Format messages as text
      const textContent = formatMessagesAsText(messagesData.messages);

      // Build filename
      const filename = buildMessageFilename(
        messagesData.application.user_first_name,
        messagesData.application.user_last_name,
        validatedApplicationId
      );

      // Set download headers
      setDownloadHeaders(res, filename, textContent);

      return res.status(200).send(textContent);
    } catch (error) {
      console.error('Error downloading conversation messages:', error);
      if (error instanceof z.ZodError) {
        if (error.issues.some(issue => issue.path.includes('applicationId'))) {
          return res.status(400).json({ error: 'Invalid application ID format' });
        }
        return res.status(500).json({ error: 'Data validation error', details: error.issues });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};

import { Pool } from 'pg';
import { ApplicationRepository } from '../../entities/application/repository';
import { ConversationRepository } from '../../entities/conversation/repository';
import { InsertApplication } from '../../entities/application/domain';
import { ScreeningDecision, ConversationStatus } from '../../entities/conversation/domain';

/**
 * Application service - handles application creation and conversation initialization.
 * 
 * When a user applies to a job:
 * 1. Create application
 * 2. Create conversation with status PENDING
 * 3. Return both IDs for the initial greeting flow
 */
export class ApplicationService {
  private applicationRepo: ApplicationRepository;
  private conversationRepo: ConversationRepository;

  constructor(private client: Pool) {
    this.applicationRepo = new ApplicationRepository(client);
    this.conversationRepo = new ConversationRepository(client);
  }

  /**
   * Create a new application and associated conversation.
   * 
   * The conversation is created with status PENDING, waiting for the user's
   * response to the initial greeting (yes/no to continue with pre-approval).
   * 
   * @param data - Application data (user_id, job_id)
   * @returns Object with applicationId and conversationId
   */
  async createApplication(data: InsertApplication): Promise<{
    applicationId: string;
    conversationId: string;
  }> {
    const applicationId = await this.applicationRepo.create(data);
    const conversationId = await this.createNewConversation(applicationId);
    return {applicationId, conversationId};
  }

  /**
   * Get application by ID (useful for checking if application exists).
   */
  async getApplication(applicationId: string) {
    return await this.applicationRepo.getById(applicationId);
  }

  /**
   * Get application with user and job data (for context loading).
   */
  async getApplicationWithContext(applicationId: string) {
    return await this.applicationRepo.getWithUserAndJob(applicationId);
  }

  /**
   * Get all applications for a user with job and conversation data.
   * Returns raw database rows with job and conversation information.
   */
  async getApplicationsWithJobAndConversationByUserId(userId: string) {
    return await this.applicationRepo.getApplicationsWithJobAndConversationByUserId(userId);
  }

  /**
   * Delete an application by ID.
   * This will cascade delete the conversation and all related data.
   * 
   * @param applicationId - The application ID to delete
   * @returns true if application was deleted, false if not found
   */
  async deleteApplication(applicationId: string): Promise<boolean> {
    return await this.applicationRepo.delete(applicationId);
  }

  private async createNewConversation(applicationId: string): Promise<string> {
    return await this.conversationRepo.create({
      application_id: applicationId,
      is_active: true,
      conversation_status: ConversationStatus.PENDING,
      screening_decision: ScreeningDecision.PENDING,  // Will be updated based on user response
    });
  }
}

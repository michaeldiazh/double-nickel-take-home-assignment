/**
 * Prompt builder for PENDING status greeting.
 * Builds the system prompt that asks the user if they want to continue with pre-approval.
 */

/**
 * Company name for Happy Hauler Trucking Co recruitment assistant.
 */
const COMPANY_NAME = 'Happy Hauler Trucking Co';

/**
 * Builds the heading for PENDING status greeting.
 * Asks if user wants to continue with pre-approval.
 */
const buildPendingHeadingLine = (jobTitle: string): string => `
    Hello, Chat! You are a helpful truck driver recruitment assistant for ${COMPANY_NAME}. 
    A candidate has applied for the ${jobTitle} position, and your role is to greet them and ask if they want to continue with the pre-approval process.
`;

/**
 * Builds guidelines for PENDING status greeting.
 * Focused on greeting and asking if user wants to continue.
 */
const buildPendingGuidelineList = (): string[] => ([
    `- Be friendly, professional, and welcoming`,
    `- Greet the candidate warmly using their first name`,
    `- Clearly ask if they would like to continue with the pre-approval process`,
    `- Be conversational and natural - don't sound robotic`,
    `- Keep the greeting concise but friendly`,
    `- Thank them for their interest in the position`,
]);

/**
 * Creates goal line for PENDING status greeting.
 * Focused on asking if user wants to continue.
 */
const createPendingGoalLine = (userFirstName: string, jobTitle: string): string => `
    Your goal is to greet ${userFirstName} warmly and ask if they would like to continue with the pre-approval process for the ${jobTitle} position.
    If they say yes, they will proceed with qualification questions. If they say no, thank them for their time.
`;

/**
 * Builds the system prompt message for PENDING status (initial greeting).
 * Asks the user if they want to continue with pre-approval.
 * 
 * @param context - The context with user first name and job title
 * @returns The system prompt message string
 */
export const buildPendingGreetingSystemPromptMessage = (context: {
  user_first_name: string;
  job_title: string;
}): string => {
  const {user_first_name, job_title} = context;
  const heading = buildPendingHeadingLine(job_title);
  const guidelines = buildPendingGuidelineList().join('\n');
  const goal = createPendingGoalLine(user_first_name, job_title);
  
  return `
    System Introduction:
    ${heading}
    
    Guidelines:
    ${guidelines}
    
    Goal:
    ${goal}
    
    Now, greet ${user_first_name} and ask if they would like to continue with the pre-approval process.
  `;
};

/**
 * Builds the system prompt message for good luck message when user declines.
 * 
 * @param context - The context with user first name and job title
 * @returns The system prompt message string
 */
export const buildGoodLuckSystemPromptMessage = (context: {
  user_first_name: string;
  job_title: string;
}): string => {
  return `You are a helpful recruitment assistant for ${COMPANY_NAME}.

The candidate (${context.user_first_name}) has declined to continue with the pre-approval process for the ${context.job_title} position.

Please send them a friendly good luck message. Be professional and courteous. Thank them for their time and wish them well in their job search.

Keep it brief and friendly.`;
};

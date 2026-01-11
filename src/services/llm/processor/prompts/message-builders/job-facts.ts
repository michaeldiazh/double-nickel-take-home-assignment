import {ConversationContext} from "../prompt-context";
import {JobFact} from "../../../../../entities";

const buildMetRequirementsHeading = (): string => `
    Hey chat! All requirements have been met for this job application.
    Please answer the user based on the following job facts. If the user just completed the preapproval,
    congratulate them and let them know the application is being processed and ask them if they have any questions.
    
    IMPORTANT: You must return your response in the following exact JSON format:
    {
      "continueWithQuestion": boolean (true if the user wants to continue asking questions, false if they are done/ready to end),
      "assistantMessage": string (the conversational message to send to the user - friendly, professional, and clear)
    }
    
    - Return ONLY the JSON object, no additional text or explanation.
    - Set "continueWithQuestion" to false if the user indicates they are done, have no more questions, want to end, or are satisfied.
    - Set "continueWithQuestion" to true if the user asks a question or wants to continue the conversation.
`
const formatJobFactLine = (jobFact: JobFact, index: number = 1): string => {
    const metaDescription = `Meta description: [${jobFact.fact_type}]`;
    const specificDetail = `Detail: ${jobFact.content}`;
    return `
        + Job Fact ${index}:
            - ${metaDescription}
            - ${specificDetail}
    `
}
const buildJobFactsLines = (jobFacts: JobFact[]) => {
    if (jobFacts.length === 0) {
        throw new Error('No job facts found.');
    }
    return jobFacts.map((jobFact, index) => formatJobFactLine(jobFact, index + 1)).join('\n');

}
/**
 * Builds a system ChatMessage indicating all requirements have been met.
 *
 * @returns A ChatMessage with SYSTEM role containing the prompt indicating all requirements are met
 */
export const buildJobFactsSystemPromptMessage = (context: ConversationContext): string => {
    const heading = buildMetRequirementsHeading();
    const jobFactsSection = buildJobFactsLines(context.job_facts);
    return `
        ${heading}
        ## Job Facts:
        ${jobFactsSection}
    `;
};
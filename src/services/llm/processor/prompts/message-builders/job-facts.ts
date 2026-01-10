import {ConversationContext} from "../prompt-context";
import {JobFacts} from "../../../../../entities";

const buildMetRequirementsHeading = (): string => `
    Hey chat! All requirements have been met for this job application.
    Please answer the user based on the following job facts. If the user just completed the preapproval,
    congratulate them and let them know the application is being processed and ask them if they have any questions.
`
const formatJobFactLine = (jobFact: JobFacts, index: number = 1): string => {
    const factType = jobFact.factType;
    const {factType: type, factDescription} = factType;
    const metaDescription = `Meta description: [${type}] - ${factDescription}`;
    const specificDetail = `Detail: ${jobFact.content}`;
    return `
        + Job Fact ${index}:
            - ${metaDescription}
            - ${specificDetail}
    `
}
const buildJobFactsLines = (jobFacts: JobFacts[]) => {
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
    const jobFactsSection = buildJobFactsLines(context.jobFacts);
    return `
        ${heading}
        ## Job Facts:
        ${jobFactsSection}
    `;
};
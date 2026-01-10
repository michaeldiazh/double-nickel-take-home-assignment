import {ConversationContext} from "../prompt-context";

const buildCompleteHeader = (firstName: string, jobTitle: string): string => `
    Okay chat! You've reached the end of the interview for ${firstName} for the position of ${jobTitle}.
`

const buildSummaryInstruction = (): string => `
    Here's the summary instruction:
    - Summarize the candidate's qualifications based on the requirements discussed during the interview.
    - Highlight key strengths and any areas that may need improvement.
    - Maintain a professional and appreciative tone throughout the summary.
    - Thank the candidate for their time and interest in the position.
`

const userDidNotMeetAllRequirementDetail = (context: ConversationContext): string => {
    const unmetRequirements = context.conversationRequirements.filter(cr => cr.status !== 'MET');
    const unmetDetails = unmetRequirements.map(ur => `- ${ur.jobRequirements.jobRequirementType.requirementDescription} (Status: ${ur.status})`).join('\n');
    return `
        However, it appears that not all requirements were met:
        ${unmetDetails}
        
        Please ensure to address these areas in future interviews. And thank you again for your time!
        Lets also summarize the candidate's qualifications based on the requirements discussed during the interview.
    `;
}

const userMetAllRequirementDetail = (context: ConversationContext): string => {
    const metRequirements = context.conversationRequirements.filter(cr => cr.status === 'MET');
    const metDetails = metRequirements.map(mr => `- ${mr.jobRequirements.jobRequirementType.requirementDescription}`).join('\n');
    return `
        Great news! All requirements have been met:
        ${metDetails}
        
        Please congratulate the candidate on successfully meeting all the requirements. Thank you again for your time!
        Let's also summarize the candidate's qualifications based on the requirements discussed during the interview.
    `;
}

const userMetAllRequirements = (context: ConversationContext): boolean => {
    const {conversationRequirements} = context;
    return conversationRequirements.every(cr => cr.status === 'MET');
}

const getRequirementDetailSection = (context: ConversationContext): string => {
    if (userMetAllRequirements(context)) {
        return userMetAllRequirementDetail(context);
    }
    return userDidNotMeetAllRequirementDetail(context);
}

/**
 * Builds a system ChatMessage indicating the interview is complete.
 */
export const buildCompletionSystemPromptMessage = (context: ConversationContext): string => {
    const {userFirstName, jobTitle} = context;
    const header = buildCompleteHeader(userFirstName, jobTitle);
    const requirementDetails = getRequirementDetailSection(context);
    const summaryInstruction = buildSummaryInstruction();
    return `
        ${header}
        
        Requirement Details:
        ${requirementDetails}
        
        Summary Instruction:
        ${summaryInstruction}
    `;
}
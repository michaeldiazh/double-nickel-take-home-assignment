import {ConversationContext} from "../prompt-context";

const buildCompleteHeader = (firstName: string, jobTitle: string): string => `
    Okay chat! You've reached the end of the interview for ${firstName} for the position of ${jobTitle}.
`

const buildSummaryInstruction = (): string => `
    Here's the summary instruction:
    - First, clearly state whether the candidate PASSED or FAILED the qualification bar based on whether all requirements were met.
    - Summarize the candidate's qualifications based on the requirements discussed during the interview.
    - Include a brief summary of the conversation, highlighting:
        * Which requirements were met (and the candidate's responses)
        * Any requirements that were not met (if applicable)
        * Key strengths and qualifications
        * Any areas that may need improvement (if applicable)
    - Maintain a professional and appreciative tone throughout the summary.
    - Thank the candidate for their time and interest in the position.
    - Format the summary clearly with sections for: Pass/Fail Status, Qualifications Summary, and Next Steps.
`

const userDidNotMeetAllRequirementDetail = (context: ConversationContext, requirements: any[]): string => {
    const unmetRequirements = context.conversation_requirements.filter(cr => cr.status !== 'MET');
    // Find matching requirements
    const unmetDetails = unmetRequirements.map(ur => {
        const req = requirements.find(r => r.id === ur.job_requirement_id);
        return `- ${req?.requirement_description || 'Unknown'} (Status: ${ur.status})`;
    }).join('\n');
    return `
        However, it appears that not all requirements were met:
        ${unmetDetails}
        
        Please ensure to address these areas in future interviews. And thank you again for your time!
        Lets also summarize the candidate's qualifications based on the requirements discussed during the interview.
    `;
}

const userMetAllRequirementDetail = (context: ConversationContext, requirements: any[]): string => {
    const metRequirements = context.conversation_requirements.filter(cr => cr.status === 'MET');
    const metDetails = metRequirements.map(mr => {
        const req = requirements.find(r => r.id === mr.job_requirement_id);
        return `- ${req?.requirement_description || 'Unknown'}`;
    }).join('\n');
    return `
        Great news! All requirements have been met:
        ${metDetails}
        
        Please congratulate the candidate on successfully meeting all the requirements. Thank you again for your time!
        Let's also summarize the candidate's qualifications based on the requirements discussed during the interview.
    `;
}

const userMetAllRequirements = (context: ConversationContext): boolean => {
    const {conversation_requirements} = context;
    return conversation_requirements.every(cr => cr.status === 'MET');
}

const getRequirementDetailSection = (context: ConversationContext): string => {
    if (userMetAllRequirements(context)) {
        return userMetAllRequirementDetail(context, context.requirements);
    }
    return userDidNotMeetAllRequirementDetail(context, context.requirements);
}

/**
 * Builds a system ChatMessage indicating the interview is complete.
 */
export const buildCompletionSystemPromptMessage = (context: ConversationContext): string => {
    const {user_first_name, job_title} = context;
    const header = buildCompleteHeader(user_first_name, job_title);
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
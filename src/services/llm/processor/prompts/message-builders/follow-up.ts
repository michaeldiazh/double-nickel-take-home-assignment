import {getResponseFormatDescription} from "../../../../criteria/response-format";

const buildFollowUpHeading = (jobTitle: string, clarificationNeeded: string) =>
    `
    Okay chat, seems like we need to ask some follow-up questions for the ${jobTitle} position...
    You need to ask a clarifying question about: ${clarificationNeeded}
   `;

const buildJSONResponseInstruction = (requirementType: string): string => `
    When you have collected enough information to evaluate this requirement, you MUST return your assessment in the following exact JSON format:
    ${getResponseFormatDescription(requirementType)}
    
    Important Notes:
    - Return ONLY the JSON object, no additional text or explanation. This ensures accurate parsing of the candidate's response.
    - The "assessment" field should be your judgment: "MET" if the candidate meets the requirement, "NOT_MET" if they don't, or "PENDING" if you need more information.
    - The "confidence" field (optional) should be a number between 0.0 and 1.0 representing how confident you are in your assessment. Higher values indicate greater confidence.
`;

const buildGuidelineListForFollowUp = (): string[] => ([
    '- Be friendly, professional, and conversational',
    '- Ask one question at a time',
    '- If a candidate\'s answer is unclear or incomplete, ask a clarifying follow-up question before moving on',
    '- Be encouraging and supportive',
    '- Focus on collecting accurate information about this specific requirement',
    '- Once you have enough information to evaluate this requirement, return the JSON response in the exact format specified above',
]);

/**
 * Builds the system prompt message for a follow-up question.
 *
 * @param jobTitle - The title of the job
 * @param clarificationNeeded - What specific clarification is needed
 * @param requirementType - The type of requirement being evaluated
 * @returns The system prompt message string for a follow-up question
 */
export const buildRequirementFollowUpSystemPromptMessage = (
    jobTitle: string,
    clarificationNeeded: string,
    requirementType: string
): string => {
    const heading = buildFollowUpHeading(jobTitle, clarificationNeeded);
    const responseFormat = buildJSONResponseInstruction(requirementType);
    const guidelines = buildGuidelineListForFollowUp().join('\n');
    return `
        ${heading}
    
        Response Format:
        ${responseFormat}
    
        Guidelines:
        ${guidelines}
    `
};
import {getResponseFormatDescription} from "../../../../criteria/response-format";
import {JobRequirements} from "../../../../../entities";

const buildFirstRequirementHeaderLine = (jobName: string): string => `
   Okay, chat! Here the a requirement for ${jobName}.:
`;


const buildFocusList = (requirements: JobRequirements): string[] => ([
    `- You are currently asking about: ${requirements.jobRequirementType.requirementDescription}`,
    `- This is a ${requirements.criteria.isRequired ? 'required' : 'preferred'} requirement`,
    `- Requirement type: ${requirements.jobRequirementType.requirementType}`,
    `- Criteria: ${JSON.stringify(requirements.criteria.criteria)}`,
])
const buildJSONResponseInstruction = (requirementType: string): string => `
    When you have collected enough information to evaluate this requirement, you MUST return your assessment in the following exact JSON format:
    ${getResponseFormatDescription(requirementType)}
    
    Important Notes:
    - Return ONLY the JSON object, no additional text or explanation. This ensures accurate parsing of the candidate's response.
    - The "assessment" field should be your judgment: "MET" if the candidate meets the requirement, "NOT_MET" if they don't, or "PENDING" if you need more information.
    - The "confidence" field (optional) should be a number between 0.0 and 1.0 representing how confident you are in your assessment. Higher values indicate greater confidence.
`;

const buildGuidelineListWithRequirement = (): string[] => ([
    '- Be friendly, professional, and conversational',
    '- Ask one question at a time',
    '- If a candidate\'s answer is unclear or incomplete, ask a clarifying follow-up question before moving on',
    '- Be encouraging and supportive',
    '- Focus on collecting accurate information about this specific requirement',
    '- Once you have enough information to evaluate this requirement, return the JSON response in the exact format specified above',
]);


export const buildRequirementSystemMessage = (
    jobName: string,
    requirements: JobRequirements
): string => {
    const heading = buildFirstRequirementHeaderLine(jobName);
    const focusList = buildFocusList(requirements).join('\n');
    const responseFormat = buildJSONResponseInstruction(requirements.jobRequirementType.requirementType);
    const guidelines = buildGuidelineListWithRequirement().join('\n');
    return `
        ${heading}
    
        Current Focus:
        ${focusList}
    
        Response Format:
        ${responseFormat}
    
        Guidelines:
        ${guidelines}\n
        If this is the first requirement, tell them it's the first one :) Let's get started!
    `
}
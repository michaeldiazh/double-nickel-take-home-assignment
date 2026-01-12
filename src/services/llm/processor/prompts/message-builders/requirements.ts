import {getResponseFormatDescription} from "../../../../criteria/response-format";
import {JobRequirement} from "../../../../../entities";

const buildFirstRequirementHeaderLine = (jobName: string): string => `
   Okay, chat! Here the a requirement for ${jobName}.:
`;

const buildAnswerCriteriaHeaderLine = (requirement: JobRequirement): string => `
    Okay, chat! We are evaluating the following criteria: ${JSON.stringify(requirement.requirement_type)}:
    - Criteria: ${JSON.stringify(requirement.criteria)}
    - Response Format: ${getResponseFormatDescription(requirement.requirement_type)}
    - Important Notes:
        - Return ONLY the JSON object, no additional text or explanation. This ensures accurate parsing of the candidate's response.
        - The "assessment" field should be your judgment: "MET" if the candidate meets the requirement, "NOT_MET" if they don't, or "PENDING" if you need more information.
        - The "confidence" field (optional) should be a number between 0.0 and 1.0 representing how confident you are in your assessment. Higher values indicate greater confidence.
        - The "message" field should contain the conversational message to send to the candidate. Be friendly, professional, and clear.
        - The "needs_clarification" field (boolean) should be set to true if you need more information from the candidate to make a determination otherwise false.
            
    - Assessment Guidelines:
        - When assessment is "MET", provide a brief confirmation in your message. The system will automatically ask the next requirement question if needed.
        - When assessment is "NOT_MET", provide a clear explanation in your message. Do NOT ask follow-up questions - the requirement is not met.
        - When assessment is "PENDING", your message should be a follow-up question to gather more information.
        - Set needs_clarification to false if you have enough information to evaluate the requirement and set the assessment to MET or NOT_MET.
        SUPER IMPORTANT:
        - If you need to ask follow-up questions, set the "needs_clarification" field to true. DO NOT set NOT_MET if you need clarification.
        - Don't set anything to MET or NOT_MET if you need more information - use PENDING and set "needs_clarification" to true.
        - Map the user's answer to the criteria as best as you can, but if it's ambiguous or incomplete, use PENDING and ask for clarification.
        - The "needs_clarification" field (boolean) should be set to true if you need more information from the candidate to make a determination.
        - DONT FORGET TO ADD THE "needs_clarification" FIELD!
        
`;

const builderTextToAnswerPortion = (userMessage: string): string => `
    The user's message is: ${userMessage}
`;

const buildFocusList = (requirement: JobRequirement): string[] => {
    // Check if criteria has 'required' field (some criteria types have it)
    const isRequired = (requirement.criteria as any)?.required ?? true;
    
    return [
        `- You are currently asking about: ${requirement.requirement_description}`,
        `- This is a ${isRequired ? 'required' : 'preferred'} requirement`,
        `- Requirement type: ${requirement.requirement_type}`,
        `- Criteria: ${JSON.stringify(requirement.criteria)}`,
    ];
};

const buildJSONResponseInstruction = (requirementType: string): string => `
    When you have collected enough information to evaluate this requirement, you MUST return your assessment in the following exact JSON format:
    ${getResponseFormatDescription(requirementType)}
    
    Important Notes:
    - Return ONLY the JSON object, no additional text or explanation. This ensures accurate parsing of the candidate's response.
    - The "assessment" field should be your judgment: "MET" if the candidate meets the requirement, "NOT_MET" if they don't, or "PENDING" if you need more information.
    - The "confidence" field (optional) should be a number between 0.0 and 1.0 representing how confident you are in your assessment. Higher values indicate greater confidence.
    - The "message" field should contain the conversational message to send to the candidate. Be friendly, professional, and clear.
    
    Assessment Guidelines:
    - DO NOT SET anything to MET or NOT_MET if you need more information - use PENDING and set "needs_clarification" to true.
       Examples of when to use PENDING: 
            - ambiguous answers
            - Rambling answers that don't directly address the requirement
            - Answers with no direct relevance to the requirement 
            - incomplete information, or if you need clarification.
    - When assessment is "MET", provide a brief confirmation in your message. The system will automatically ask the next requirement question if needed.
    - When assessment is "NOT_MET", provide a clear explanation in your message. Do NOT ask follow-up questions - the requirement is not met.
    - When assessment is "PENDING", your message should be a follow-up question to gather more information.
    SUPER IMPORTANT:
    - If you need to ask follow-up questions, set the "needs_clarification" field to true. DO NOT set NOT_MET if you need clarification.
    - Don't set anything to MET or NOT_MET if you need more information - use PENDING and set "needs_clarification" to true.
    - Map the user's answer to the criteria as best as you can, but if it's ambiguous or incomplete, use PENDING and ask for clarification.
    - The "needs_clarification" field (boolean) should be set to true if you need more information from the candidate to make a determination.
    - DONT FORGET TO ADD THE "needs_clarification" FIELD!
`;

const buildGuidelineListWithRequirement = (): string[] => ([
    '- Be friendly, professional, and conversational',
    '- Ask one question at a time',
    '- If a candidate\'s answer is unclear or incomplete, ask a clarifying follow-up question (use PENDING assessment)',
    '- If a candidate clearly does NOT meet the requirement, mark as NOT_MET immediately - do NOT ask follow-up questions',
    '- If a candidate clearly meets or exceeds the requirement, mark as MET',
    '- Be encouraging and supportive, but honest about requirements',
    '- Focus on collecting accurate information about this specific requirement',
    '- Once you have enough information to evaluate this requirement, return the JSON response in the exact format specified above',
]);


export const buildRequirementSystemMessage = (
    jobName: string,
    requirement: JobRequirement
): string => {
    const heading = buildFirstRequirementHeaderLine(jobName);
    const focusList = buildFocusList(requirement).join('\n');
    const responseFormat = buildJSONResponseInstruction(requirement.requirement_type);
    const guidelines = buildGuidelineListWithRequirement().join('\n');
    return `
        ${heading}
    
        Current Focus:
        ${focusList}
    
        Response Format:
        ${responseFormat}
    
        Guidelines:
        ${guidelines}\n
    `
}

export const buildAnswerCriteriaSystemPrompt = (userMessage: string, requirement: JobRequirement): string => {
    const header = buildAnswerCriteriaHeaderLine(requirement);
    return `
        ${header}
        ${builderTextToAnswerPortion(userMessage)}
    `
}

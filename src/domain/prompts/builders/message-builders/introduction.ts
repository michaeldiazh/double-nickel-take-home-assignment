import {SystemPromptWithRequirementParams} from "../types";
import {getResponseFormatDescription} from "../../../criteria/response-format";
import {ConversationContext} from "../types";

/**
 * Company name for Happy Hauler Trucking Co recruitment assistant.
 */
const COMPANY_NAME = 'Happy Hauler Trucking Co';


const buildHeadingLine = (jobTitle: string): string => `
    Hello, Chat! You are a helpful truck driver recruitment assistant for ${COMPANY_NAME}. 
    Your role is to guide candidates through job qualification questions for a ${jobTitle} position.
`;

/**
 * Builds the list of guidelines for the recruitment assistant.
 *
 * @param jobTitle
 */
const buildGuidelineList = (jobTitle: string): string[] => ([
    `- Be friendly, professional, and conversational`,
    `- Ask one question at a time`,
    `- If a candidate's answer is unclear or incomplete, ask a clarifying follow-up question before moving on`,
    `- Be encouraging and supportive`,
    `- Focus on collecting accurate information about the candidate's qualifications for this specific role`,
    `- Once you have enough information to evaluate a requirement, confirm it and move to the next one`,
    `- You can answer questions about ${COMPANY_NAME}, this specific job, pay, benefits, schedule, location, etc.`,
    `- If asked about other positions at ${COMPANY_NAME}, you can mention that ${COMPANY_NAME} has other openings, but redirect focus back to screening for the ${jobTitle} position`,
]);

const createGoalLine = (jobTitle: string): string => `
    Your goal is to help candidates complete their application screening for the ${jobTitle} position by collecting their qualifications through natural conversation.
`;

/**
 * Builds the system prompt message for the LLM chatbot.
 * Used when conversation status is START (user already said yes, ready to begin screening).
 *
 * @param context - The conversation context containing job title
 * @returns The system prompt message string
 */
export const buildIntroductionSystemPromptMessage = (context: ConversationContext): string => {
    const {user_first_name, job_title} = context;
    const heading = buildHeadingLine(job_title);
    const guidelines = buildGuidelineList(job_title).join('\n');
    return `
        System Introduction:
        ${heading}
        
        Guidelines:
        ${guidelines}
        
        Goal:
        ${createGoalLine(job_title)}
        
        Lets get started and say hello to ${user_first_name}!
    `
};

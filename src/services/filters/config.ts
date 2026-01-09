import {KeyTranslator, WhereFilterConfiguration} from "./where-filter";
import {
    addressFilterSchema,
    addressDomainKeyToTableKey,
    addressSchema,
    ADDRESS_DATABASE_TABLE,
    ADDRESS_DOMAIN_PROPERTY_NAME,
    userDomainKeyToTableKey,
    userFiltersSchema,
    userSchema,
    USER_DATABASE_TABLE,
    USER_DOMAIN_PROPERTY_NAME,
    jobFilterSchema,
    jobDomainKeyToTableKey,
    jobSchema,
    JOB_DATABASE_TABLE,
    JOB_DOMAIN_PROPERTY_NAME,
    applicationFilterSchema,
    applicationDomainKeyToTableKey,
    applicationSchema,
    APPLICATION_DATABASE_TABLE,
    APPLICATION_DOMAIN_PROPERTY_NAME,
    conversationFilterSchema,
    conversationDomainKeyToTableKey,
    conversationSchema,
    CONVERSATION_DATABASE_TABLE,
    CONVERSATION_DOMAIN_PROPERTY_NAME,
    jobRequirementTypeFilterSchema,
    jobRequirementTypeDomainKeyToTableKey,
    jobRequirementTypeSchema,
    JOB_REQUIREMENT_TYPE_DATABASE_TABLE,
    JOB_REQUIREMENT_TYPE_DOMAIN_PROPERTY_NAME,
    jobRequirementsFilterSchema,
    jobRequirementsDomainKeyToTableKey,
    jobRequirementsSchema,
    JOB_REQUIREMENTS_DATABASE_TABLE,
    JOB_REQUIREMENTS_DOMAIN_PROPERTY_NAME,
    conversationRequirementsFilterSchema,
    conversationRequirementsDomainKeyToTableKey,
    conversationRequirementsSchema,
    CONVERSATION_REQUIREMENTS_DATABASE_TABLE,
    CONVERSATION_REQUIREMENTS_DOMAIN_PROPERTY_NAME
} from "../../entities";
import {z} from "zod";

/**
 * Creates a function that maps domain keys to table keys using the provided translator.
 *
 * @param tableName
 * @param translator
 * @returns A function that takes a domain key and returns the corresponding table key.
 */
const createDomainToTableKeyMapper = (tableName: string, translator: KeyTranslator) =>
    (key: string) => {
        if (!(key in translator)) {
            throw new Error(`Invalid domain key for ${tableName}: ${key}`);
        }
        return translator[key];
    };

/**
 * Creates a domain key validator function based on the provided schema.
 *
 * @param schema
 * @returns A function that validates if a given object is a key of the schema.
 */
const createDomainKeyValidator = (schema: z.ZodObject) =>
    (obj: any): obj is keyof z.infer<typeof schema> => !schema.keyof().safeParse(obj).error;

export const WhereFilterConfigurations: Record<string, WhereFilterConfiguration> = {
    [ADDRESS_DOMAIN_PROPERTY_NAME]: {
        tableName: ADDRESS_DATABASE_TABLE,
        domainToTableTranslator: addressDomainKeyToTableKey,
        domainKeyValidator: createDomainKeyValidator(addressSchema),
        domainFilterSchema: addressFilterSchema,
        domainToTableKey: createDomainToTableKeyMapper(ADDRESS_DATABASE_TABLE, addressDomainKeyToTableKey),
    },
    [USER_DOMAIN_PROPERTY_NAME]: {
        tableName: USER_DATABASE_TABLE,
        domainToTableTranslator: userDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(USER_DATABASE_TABLE, userDomainKeyToTableKey),
        domainFilterSchema: userFiltersSchema,
        domainKeyValidator: createDomainKeyValidator(userSchema),
    },
    [JOB_DOMAIN_PROPERTY_NAME]: {
        tableName: JOB_DATABASE_TABLE,
        domainToTableTranslator: jobDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(JOB_DATABASE_TABLE, jobDomainKeyToTableKey),
        domainFilterSchema: jobFilterSchema,
        domainKeyValidator: createDomainKeyValidator(jobSchema),
    },
    [APPLICATION_DOMAIN_PROPERTY_NAME]: {
        tableName: APPLICATION_DATABASE_TABLE,
        domainToTableTranslator: applicationDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(APPLICATION_DATABASE_TABLE, applicationDomainKeyToTableKey),
        domainFilterSchema: applicationFilterSchema,
        domainKeyValidator: createDomainKeyValidator(applicationSchema),
    },
    [CONVERSATION_DOMAIN_PROPERTY_NAME]: {
        tableName: CONVERSATION_DATABASE_TABLE,
        domainToTableTranslator: conversationDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(CONVERSATION_DATABASE_TABLE, conversationDomainKeyToTableKey),
        domainFilterSchema: conversationFilterSchema,
        domainKeyValidator: createDomainKeyValidator(conversationSchema),
    },
    [JOB_REQUIREMENT_TYPE_DOMAIN_PROPERTY_NAME]: {
        tableName: JOB_REQUIREMENT_TYPE_DATABASE_TABLE,
        domainToTableTranslator: jobRequirementTypeDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(JOB_REQUIREMENT_TYPE_DATABASE_TABLE, jobRequirementTypeDomainKeyToTableKey),
        domainFilterSchema: jobRequirementTypeFilterSchema,
        domainKeyValidator: createDomainKeyValidator(jobRequirementTypeSchema),
    },
    [JOB_REQUIREMENTS_DOMAIN_PROPERTY_NAME]: {
        tableName: JOB_REQUIREMENTS_DATABASE_TABLE,
        domainToTableTranslator: jobRequirementsDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(JOB_REQUIREMENTS_DATABASE_TABLE, jobRequirementsDomainKeyToTableKey),
        domainFilterSchema: jobRequirementsFilterSchema,
        domainKeyValidator: createDomainKeyValidator(jobRequirementsSchema),
    },
    [CONVERSATION_REQUIREMENTS_DOMAIN_PROPERTY_NAME]: {
        tableName: CONVERSATION_REQUIREMENTS_DATABASE_TABLE,
        domainToTableTranslator: conversationRequirementsDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(CONVERSATION_REQUIREMENTS_DATABASE_TABLE, conversationRequirementsDomainKeyToTableKey),
        domainFilterSchema: conversationRequirementsFilterSchema,
        domainKeyValidator: createDomainKeyValidator(conversationRequirementsSchema),
    }
};

export type WhereFilterConfigurationsDomainName = keyof typeof WhereFilterConfigurations;
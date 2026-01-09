"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhereFilterConfigurations = void 0;
const entities_1 = require("../../entities");
/**
 * Creates a function that maps domain keys to table keys using the provided translator.
 *
 * @param tableName
 * @param translator
 * @returns A function that takes a domain key and returns the corresponding table key.
 */
const createDomainToTableKeyMapper = (tableName, translator) => (key) => {
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
const createDomainKeyValidator = (schema) => (obj) => !schema.keyof().safeParse(obj).error;
exports.WhereFilterConfigurations = {
    [entities_1.ADDRESS_DOMAIN_PROPERTY_NAME]: {
        tableName: entities_1.ADDRESS_DATABASE_TABLE,
        domainToTableTranslator: entities_1.addressDomainKeyToTableKey,
        domainKeyValidator: createDomainKeyValidator(entities_1.addressSchema),
        domainFilterSchema: entities_1.addressFilterSchema,
        domainToTableKey: createDomainToTableKeyMapper(entities_1.ADDRESS_DATABASE_TABLE, entities_1.addressDomainKeyToTableKey),
    },
    [entities_1.USER_DOMAIN_PROPERTY_NAME]: {
        tableName: entities_1.USER_DATABASE_TABLE,
        domainToTableTranslator: entities_1.userDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(entities_1.USER_DATABASE_TABLE, entities_1.userDomainKeyToTableKey),
        domainFilterSchema: entities_1.userFiltersSchema,
        domainKeyValidator: createDomainKeyValidator(entities_1.userSchema),
    },
    [entities_1.JOB_DOMAIN_PROPERTY_NAME]: {
        tableName: entities_1.JOB_DATABASE_TABLE,
        domainToTableTranslator: entities_1.jobDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(entities_1.JOB_DATABASE_TABLE, entities_1.jobDomainKeyToTableKey),
        domainFilterSchema: entities_1.jobFilterSchema,
        domainKeyValidator: createDomainKeyValidator(entities_1.jobSchema),
    },
    [entities_1.APPLICATION_DOMAIN_PROPERTY_NAME]: {
        tableName: entities_1.APPLICATION_DATABASE_TABLE,
        domainToTableTranslator: entities_1.applicationDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(entities_1.APPLICATION_DATABASE_TABLE, entities_1.applicationDomainKeyToTableKey),
        domainFilterSchema: entities_1.applicationFilterSchema,
        domainKeyValidator: createDomainKeyValidator(entities_1.applicationSchema),
    },
    [entities_1.CONVERSATION_DOMAIN_PROPERTY_NAME]: {
        tableName: entities_1.CONVERSATION_DATABASE_TABLE,
        domainToTableTranslator: entities_1.conversationDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(entities_1.CONVERSATION_DATABASE_TABLE, entities_1.conversationDomainKeyToTableKey),
        domainFilterSchema: entities_1.conversationFilterSchema,
        domainKeyValidator: createDomainKeyValidator(entities_1.conversationSchema),
    },
    [entities_1.JOB_REQUIREMENT_TYPE_DOMAIN_PROPERTY_NAME]: {
        tableName: entities_1.JOB_REQUIREMENT_TYPE_DATABASE_TABLE,
        domainToTableTranslator: entities_1.jobRequirementTypeDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(entities_1.JOB_REQUIREMENT_TYPE_DATABASE_TABLE, entities_1.jobRequirementTypeDomainKeyToTableKey),
        domainFilterSchema: entities_1.jobRequirementTypeFilterSchema,
        domainKeyValidator: createDomainKeyValidator(entities_1.jobRequirementTypeSchema),
    },
    [entities_1.JOB_REQUIREMENTS_DOMAIN_PROPERTY_NAME]: {
        tableName: entities_1.JOB_REQUIREMENTS_DATABASE_TABLE,
        domainToTableTranslator: entities_1.jobRequirementsDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(entities_1.JOB_REQUIREMENTS_DATABASE_TABLE, entities_1.jobRequirementsDomainKeyToTableKey),
        domainFilterSchema: entities_1.jobRequirementsFilterSchema,
        domainKeyValidator: createDomainKeyValidator(entities_1.jobRequirementsSchema),
    },
    [entities_1.CONVERSATION_REQUIREMENTS_DOMAIN_PROPERTY_NAME]: {
        tableName: entities_1.CONVERSATION_REQUIREMENTS_DATABASE_TABLE,
        domainToTableTranslator: entities_1.conversationRequirementsDomainKeyToTableKey,
        domainToTableKey: createDomainToTableKeyMapper(entities_1.CONVERSATION_REQUIREMENTS_DATABASE_TABLE, entities_1.conversationRequirementsDomainKeyToTableKey),
        domainFilterSchema: entities_1.conversationRequirementsFilterSchema,
        domainKeyValidator: createDomainKeyValidator(entities_1.conversationRequirementsSchema),
    }
};

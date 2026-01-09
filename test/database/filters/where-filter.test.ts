import {generateWhereFilters} from "../../../src/services/filters/where-filter";
import userTestCases from '../fixtures/user.where-filter.json';
import addressTestCases from '../fixtures/address.where-filter.json';
import jobTestCases from '../fixtures/job.where-filter.json';
import applicationTestCases from '../fixtures/application.where-filter.json';
import conversationTestCases from '../fixtures/conversation.where-filter.json';
import jobRequirementTypeTestCases from '../fixtures/job-requirement-type.where-filter.json';
import conversationRequirementsTestCases from '../fixtures/conversation-requirements.where-filter.json';

describe('Where Filter Builder', () => {
    describe('Users Filter Builder', () => {
        userTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = generateWhereFilters('user', testCase.input);
                expect(result).toEqual(testCase.expected);
            });
        });
    })

    describe('Address Filter Builder', () => {
        addressTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = generateWhereFilters('address', testCase.input);
                expect(result).toEqual(testCase.expected);
            });
        });
    })

    describe('Job Filter Builder', () => {
        jobTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = generateWhereFilters('job', testCase.input);
                expect(result).toEqual(testCase.expected);
            });
        });
    })

    describe('Application Filter Builder', () => {
        applicationTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = generateWhereFilters('application', testCase.input);
                expect(result).toEqual(testCase.expected);

            });
        });
    })

    describe('Conversation Filter Builder', () => {
        conversationTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = generateWhereFilters('conversation', testCase.input);
                expect(result).toEqual(testCase.expected);

            });
        });
    })

    describe('Job Requirement Type Filter Builder', () => {
        jobRequirementTypeTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = generateWhereFilters('jobRequirementType', testCase.input);
                expect(result).toEqual(testCase.expected);
            });
        });
    })

    describe('Conversation Requirements Filter Builder', () => {
        conversationRequirementsTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                if (testCase.testName === 'creating where options for conversation-requirements with nested jobRequirements filter') {
                    const result = generateWhereFilters('conversationRequirements', testCase.input);
                    expect(result).toEqual(testCase.expected);
                }

            });
        });
    })
})

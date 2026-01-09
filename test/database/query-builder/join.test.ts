import {buildJoinClause} from '../../../src/database/query-builder/join';
import type {Join} from '../../../src/database/types/query-types';
import userTestCases from '../fixtures/user.join.json';
import addressTestCases from '../fixtures/address.join.json';
import jobTestCases from '../fixtures/job.join.json';
import applicationTestCases from '../fixtures/application.join.json';
import conversationTestCases from '../fixtures/conversation.join.json';
import jobRequirementTypeTestCases from '../fixtures/job-requirement-type.join.json';
import conversationRequirementsTestCases from '../fixtures/conversation-requirements.join.json';

describe('Join Clause Builder', () => {
    describe('User Join Clause Builder', () => {
        userTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildJoinClause(testCase.input as Join);
                expect(result).toBe(testCase.expected);
            });
        });
    });

    describe('Address Join Clause Builder', () => {
        addressTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildJoinClause(testCase.input as Join);
                expect(result).toBe(testCase.expected);
            });
        });
    });

    describe('Job Join Clause Builder', () => {
        jobTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildJoinClause(testCase.input as Join);
                expect(result).toBe(testCase.expected);
            });
        });
    });

    describe('Application Join Clause Builder', () => {
        applicationTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildJoinClause(testCase.input as Join);
                expect(result).toBe(testCase.expected);
            });
        });
    });

    describe('Conversation Join Clause Builder', () => {
        conversationTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildJoinClause(testCase.input as Join);
                expect(result).toBe(testCase.expected);
            });
        });
    });

    describe('Job Requirement Type Join Clause Builder', () => {
        jobRequirementTypeTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildJoinClause(testCase.input as Join);
                expect(result).toBe(testCase.expected);
            });
        });
    });

    describe('Conversation Requirements Join Clause Builder', () => {
        conversationRequirementsTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildJoinClause(testCase.input as Join);
                expect(result).toBe(testCase.expected);
            });
        });
    });
});


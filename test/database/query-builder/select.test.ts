import {buildSelectQuery} from '../../../src/database/query-builder/select';
import type {BuildSelectQueryOptions} from '../../../src/database/types/query-types';
import userTestCases from '../fixtures/user.select.json';
import addressTestCases from '../fixtures/address.select.json';
import jobTestCases from '../fixtures/job.select.json';
import applicationTestCases from '../fixtures/application.select.json';
import conversationTestCases from '../fixtures/conversation.select.json';
import jobRequirementTypeTestCases from '../fixtures/job-requirement-type.select.json';
import conversationRequirementsTestCases from '../fixtures/conversation-requirements.select.json';

describe('Select Query Builder', () => {
    describe('User Select Query Builder', () => {
        userTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildSelectQuery(testCase.input as BuildSelectQueryOptions);
                expect(result.query).toBe(testCase.expected.query);
                expect(result.values).toEqual(testCase.expected.values);
            });
        });
    });

    describe('Address Select Query Builder', () => {
        addressTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildSelectQuery(testCase.input as BuildSelectQueryOptions);
                expect(result.query).toBe(testCase.expected.query);
                expect(result.values).toEqual(testCase.expected.values);
            });
        });
    });

    describe('Job Select Query Builder', () => {
        jobTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildSelectQuery(testCase.input as BuildSelectQueryOptions);
                expect(result.query).toBe(testCase.expected.query);
                expect(result.values).toEqual(testCase.expected.values);
            });
        });
    });

    describe('Application Select Query Builder', () => {
        applicationTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildSelectQuery(testCase.input as BuildSelectQueryOptions);
                expect(result.query).toBe(testCase.expected.query);
                expect(result.values).toEqual(testCase.expected.values);
            });
        });
    });

    describe('Conversation Select Query Builder', () => {
        conversationTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildSelectQuery(testCase.input as BuildSelectQueryOptions);
                expect(result.query).toBe(testCase.expected.query);
                expect(result.values).toEqual(testCase.expected.values);
            });
        });
    });

    describe('Job Requirement Type Select Query Builder', () => {
        jobRequirementTypeTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildSelectQuery(testCase.input as BuildSelectQueryOptions);
                expect(result.query).toBe(testCase.expected.query);
                expect(result.values).toEqual(testCase.expected.values);
            });
        });
    });

    describe('Conversation Requirements Select Query Builder', () => {
        conversationRequirementsTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const result = buildSelectQuery(testCase.input as BuildSelectQueryOptions);
                expect(result.query).toBe(testCase.expected.query);
                expect(result.values).toEqual(testCase.expected.values);
            });
        });
    });
});


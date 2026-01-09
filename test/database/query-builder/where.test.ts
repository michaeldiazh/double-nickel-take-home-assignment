import {buildWhereClause} from '../../../src/database/query-builder/where';
import type {WhereOption, WhereCompositionOption} from '../../../src/database/types/query-types';
import userTestCases from '../fixtures/user.where-clause.json';
import addressTestCases from '../fixtures/address.where-clause.json';

describe('Where Clause Builder', () => {
    describe('User Where Clause Builder', () => {
        userTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const [clause, values] = buildWhereClause(testCase.input as WhereOption[] | WhereCompositionOption);
                expect(clause).toBe(testCase.expected.clause);
                expect(values).toEqual(testCase.expected.values);
            });
        });
    });

    describe('Address Where Clause Builder', () => {
        addressTestCases.forEach((testCase) => {
            it(testCase.testName, () => {
                const [clause, values] = buildWhereClause(testCase.input as WhereOption[] | WhereCompositionOption);
                expect(clause).toBe(testCase.expected.clause);
                expect(values).toEqual(testCase.expected.values);
            });
        });
    });
});


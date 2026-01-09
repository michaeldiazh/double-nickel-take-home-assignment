"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUpdateQuery = void 0;
const join_1 = require("./join");
const where_1 = require("./where");
const generateSetClause = (updateOption) => {
    const setTexts = [];
    const values = [];
    const { setClauses } = updateOption;
    for (const clause of setClauses) {
        setTexts.push(`${clause.column} = ${clause.placeholder}`);
        values.push(clause.value);
    }
    const setText = setTexts.join(', ');
    return ['set ' + setText, values];
};
const generateJoinsClause = (joinClauses) => {
    if (!joinClauses)
        return '';
    return joinClauses.map((join) => (0, join_1.buildJoinClause)(join)).join(' ');
};
const generateWhereClause = (whereClause) => {
    if (!whereClause)
        return ['', []];
    return (0, where_1.buildWhereClause)(whereClause);
};
/**
 *
 * @param updateOptions
 */
const buildUpdateQuery = (updateOptions) => {
    const { tableName, joinClauses, whereClause } = updateOptions;
    const [setClauseText, setValues] = generateSetClause(updateOptions);
    const joinsText = generateJoinsClause(joinClauses);
    const [whereClauseText, whereValues] = generateWhereClause(whereClause);
    const values = [...setValues, ...whereValues];
    const query = `update ${tableName} ${setClauseText} ${joinsText} ${whereClauseText} returning *`.trim();
    return { query, values };
};
exports.buildUpdateQuery = buildUpdateQuery;

import {BuildUpdateQueryOptions, type Join, WhereCompositionOption, WhereOption} from "../types/query-types";
import {buildJoinClause} from "./join";
import {buildWhereClause} from "./where";
import {QueryValues} from "../types";

const generateSetClause = (updateOption: BuildUpdateQueryOptions): [string, unknown[]] => {
    const setTexts: string[] = [];
    const values: unknown[] = [];
    const {setClauses} = updateOption;
    for (const clause of setClauses) {
        setTexts.push(`${clause.column} = ${clause.placeholder}`);
        values.push(clause.value);
    }
    const setText = setTexts.join(', ');
    return ['set ' + setText, values];
}

const generateJoinsClause = (joinClauses?: Join[]): string => {
    if (!joinClauses) return '';
    return joinClauses.map((join) => buildJoinClause(join)).join(' ');
}

const generateWhereClause = (whereClause?: WhereOption[] | WhereCompositionOption): [string, unknown[]] => {
    if (!whereClause) return ['', []];
    return buildWhereClause(whereClause);
}

/**
 *
 * @param updateOptions
 */
export const buildUpdateQuery = (updateOptions: BuildUpdateQueryOptions): QueryValues => {
    const {tableName, joinClauses, whereClause} = updateOptions;
    const [setClauseText, setValues] = generateSetClause(updateOptions);
    const joinsText = generateJoinsClause(joinClauses);
    const [whereClauseText, whereValues] = generateWhereClause(whereClause);
    const values = [...setValues, ...whereValues];
    const query = `update ${tableName} ${setClauseText} ${joinsText} ${whereClauseText} returning *`.trim();
    return {query, values};
}
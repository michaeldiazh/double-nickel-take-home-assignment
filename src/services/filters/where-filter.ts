import {WhereOption} from "../../database/types/query-types";
import {getWhereFilterType} from "../../database/common";
import {z} from "zod";
import {WhereFilterConfigurations, WhereFilterConfigurationsDomainName} from "./config";
import {createDomainReferenceHandler} from "./reference-graph";
import {createLinkedQueue, DoubleLinkedQueue} from "../../data-stuctures/queue";

export type KeyTranslator<Domain = Record<string, unknown>> = {
    [key in keyof Domain]: Domain[key] extends Date ? string
        : Domain[key] extends number ? string
            : Domain[key] extends object ? KeyTranslator<Domain[key]> | { [subKey in keyof Domain[key]]: string }
                : Domain[key] extends undefined ? string : key extends 'passwordHash' ? undefined : string

}


export type WhereFilterConfiguration<Domain = Record<string, unknown>, Table = Record<string, unknown>> = {
    tableName: string,
    domainToTableTranslator: KeyTranslator<Domain>,
    domainToTableKey: (key: string) => keyof Table,
    domainFilterSchema: z.ZodSchema,
    domainKeyValidator: (obj: any) => obj is keyof Domain
}

export type WhereFilterRegistry<Domain = Record<string, unknown>, Table = Record<string, unknown>> = {
    tableName: string,
    parseFilter: (filter: unknown) => Partial<Record<string, unknown>>,
    parseDomainKeys: (filter: Partial<Record<string, unknown>>) => (keyof Domain)[]
    domainToTableKey: (key: keyof Domain) => keyof Table,
};

type NestedTableStackItem = {
    registry: WhereFilterRegistry;
    filterData: Partial<Record<string, unknown>>;
};


const createWhereFilterRegistry = (config: WhereFilterConfiguration): WhereFilterRegistry => ({
    tableName: config.tableName,
    parseFilter: (filter: unknown): Partial<Record<string, unknown>> => {
        const parseValue = config.domainFilterSchema.parse(filter);
        return parseValue as Record<string, unknown>;
    },
    parseDomainKeys: (filter: Partial<Record<string, unknown>>): string[] =>
        Object.keys(filter).filter((key) => config.domainKeyValidator(key)),
    domainToTableKey: (key: string) => config.domainToTableKey(key),
});

export const getRegistryByDomainName = (domainName: WhereFilterConfigurationsDomainName): WhereFilterRegistry => {
    const config = WhereFilterConfigurations[domainName];
    if (!config) {
        throw new Error(`No where filter configuration found for domain: ${domainName}`);
    }
    return createWhereFilterRegistry(config);
}

const mapDomainNameToRegistries = (domainNames: string[]): WhereFilterRegistry[] =>
    domainNames.map((domainName) => getRegistryByDomainName(domainName as WhereFilterConfigurationsDomainName));


export const filterKeyReferencesDifferentTable = (filterKey: string): filterKey is WhereFilterConfigurationsDomainName =>
    filterKey in WhereFilterConfigurations;


const createWhereFilterListBuilder = (domainRegistry: WhereFilterRegistry) => {
    /**
     * Creates a WhereOption based on the provided key, filter operator, and filter value.
     * @param key
     * @param filterOperator
     * @param filterValue
     */
    const createWhereFilter = (key: string, filterOperator: string, filterValue: unknown): WhereOption => {
        const tableKey = domainRegistry.domainToTableKey(key);
        const queryFilter = getWhereFilterType(filterOperator);
        if (filterValue instanceof Date) {
            filterValue = filterValue.toISOString();
        }
        return {tableName: domainRegistry.tableName, column: tableKey, filter: queryFilter, value: filterValue};
    }

    return (key: string, domainFilter: Partial<Record<string, unknown>>): WhereOption[] => {
        const filterOption = domainFilter[key]!;
        return Object.entries(filterOption).map(([filterOperator, filterValue]) => createWhereFilter(key, filterOperator, filterValue));
    }
}

const buildWhereFilterList = (keys: string[], domainRegistry: WhereFilterRegistry, domainFilter: Partial<Record<string, unknown>>): WhereOption[] => {
    const whereOptions: WhereOption[] = [];
    const whereFilterListBuilder = createWhereFilterListBuilder(domainRegistry);
    for (const key of keys) {
        whereOptions.push(...whereFilterListBuilder(key, domainFilter))
    }
    return whereOptions;
}

const initializeNestedTableStack = (
    referencedDomainRegistries: WhereFilterRegistry[],
    filterData: Partial<Record<string, unknown>>
): NestedTableStackItem[] => {
    const nestedTableStack: NestedTableStackItem[] = [];
    for (const referencedDomainRegistry of referencedDomainRegistries) {
        // Find the domain name that maps to this registry's table name
        const domainNameForRegistry = Object.keys(WhereFilterConfigurations).find(
            (domainName) => WhereFilterConfigurations[domainName as WhereFilterConfigurationsDomainName].tableName === referencedDomainRegistry.tableName
        );
        if (domainNameForRegistry) {
            const referencedDomainFilter = referencedDomainRegistry.parseFilter(filterData[domainNameForRegistry]);
            nestedTableStack.push({registry: referencedDomainRegistry, filterData: referencedDomainFilter});
        }
    }
    return nestedTableStack;
}

const getWhereFiltersByReferenceChains = (filterData: Record<string, unknown>, referenceChain: string[]) => {
    let currentFilterData = {...filterData};
    referenceChain = referenceChain.slice(1);
    const whereOptions: WhereOption[] = [];
    for (const referencedDomainName of referenceChain) {
        const referencedRegistry = getRegistryByDomainName(referencedDomainName);
        currentFilterData = referencedRegistry.parseFilter(currentFilterData[referencedDomainName]);
        const referencedFilterKeys = referencedRegistry.parseDomainKeys(currentFilterData);
        const directFieldKeys = referencedFilterKeys.filter((key) => !filterKeyReferencesDifferentTable(key));
        whereOptions.push(...buildWhereFilterList(directFieldKeys, referencedRegistry, currentFilterData));
    }
    return whereOptions;
}

export const generateWhereFilters = (domainName: WhereFilterConfigurationsDomainName, possibleFilter: unknown) => {
    const mainTableRegistry = getRegistryByDomainName(domainName);
    const filterData = mainTableRegistry.parseFilter(possibleFilter);
    const referenceGraphHandler = createDomainReferenceHandler(domainName, filterData);
    const referenceChains = referenceGraphHandler.getReferenceChains();
    // Get main table keys
    const filterKeys: string[] = mainTableRegistry.parseDomainKeys(filterData);
    const mainTableKeys = filterKeys.filter((key) => !filterKeyReferencesDifferentTable(key));
    const whereOptions: WhereOption[] = [...buildWhereFilterList(mainTableKeys, mainTableRegistry, filterData)];
    // Process each reference chain
    for (const chain of referenceChains) {
        whereOptions.push(...getWhereFiltersByReferenceChains(filterData, chain));
    }
    return whereOptions;
}

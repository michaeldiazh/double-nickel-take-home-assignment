"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWhereFilters = exports.generateWhereFiltersV2 = exports.filterKeyReferencesDifferentTable = exports.getRegistryByDomainName = void 0;
const common_1 = require("../common");
const config_1 = require("./config");
const reference_graph_1 = require("./reference-graph");
const createWhereFilterRegistry = (config) => ({
    tableName: config.tableName,
    parseFilter: (filter) => {
        const parseValue = config.domainFilterSchema.parse(filter);
        return parseValue;
    },
    parseDomainKeys: (filter) => Object.keys(filter).filter((key) => config.domainKeyValidator(key)),
    domainToTableKey: (key) => config.domainToTableKey(key),
});
const getRegistryByDomainName = (domainName) => {
    const config = config_1.WhereFilterConfigurations[domainName];
    if (!config) {
        throw new Error(`No where filter configuration found for domain: ${domainName}`);
    }
    return createWhereFilterRegistry(config);
};
exports.getRegistryByDomainName = getRegistryByDomainName;
const mapDomainNameToRegistries = (domainNames) => domainNames.map((domainName) => (0, exports.getRegistryByDomainName)(domainName));
const filterKeyReferencesDifferentTable = (filterKey) => filterKey in config_1.WhereFilterConfigurations;
exports.filterKeyReferencesDifferentTable = filterKeyReferencesDifferentTable;
const createWhereFilterListBuilder = (domainRegistry) => {
    /**
     * Creates a WhereOption based on the provided key, filter operator, and filter value.
     * @param key
     * @param filterOperator
     * @param filterValue
     */
    const createWhereFilter = (key, filterOperator, filterValue) => {
        const tableKey = domainRegistry.domainToTableKey(key);
        const queryFilter = (0, common_1.getWhereFilterType)(filterOperator);
        if (filterValue instanceof Date) {
            filterValue = filterValue.toISOString();
        }
        return { tableName: domainRegistry.tableName, column: tableKey, filter: queryFilter, value: filterValue };
    };
    return (key, domainFilter) => {
        const filterOption = domainFilter[key];
        return Object.entries(filterOption).map(([filterOperator, filterValue]) => createWhereFilter(key, filterOperator, filterValue));
    };
};
const buildWhereFilterList = (keys, domainRegistry, domainFilter) => {
    const whereOptions = [];
    const whereFilterListBuilder = createWhereFilterListBuilder(domainRegistry);
    for (const key of keys) {
        whereOptions.push(...whereFilterListBuilder(key, domainFilter));
    }
    return whereOptions;
};
const initializeNestedTableStack = (referencedDomainRegistries, filterData) => {
    const nestedTableStack = [];
    for (const referencedDomainRegistry of referencedDomainRegistries) {
        // Find the domain name that maps to this registry's table name
        const domainNameForRegistry = Object.keys(config_1.WhereFilterConfigurations).find((domainName) => config_1.WhereFilterConfigurations[domainName].tableName === referencedDomainRegistry.tableName);
        if (domainNameForRegistry) {
            const referencedDomainFilter = referencedDomainRegistry.parseFilter(filterData[domainNameForRegistry]);
            nestedTableStack.push({ registry: referencedDomainRegistry, filterData: referencedDomainFilter });
        }
    }
    return nestedTableStack;
};
const getWhereFiltersByReferenceChains = (filterData, referenceChain) => {
    let currentFilterData = { ...filterData };
    referenceChain = referenceChain.slice(1);
    const whereOptions = [];
    for (const referencedDomainName of referenceChain) {
        const referencedRegistry = (0, exports.getRegistryByDomainName)(referencedDomainName);
        currentFilterData = referencedRegistry.parseFilter(currentFilterData[referencedDomainName]);
        const referencedFilterKeys = referencedRegistry.parseDomainKeys(currentFilterData);
        const directFieldKeys = referencedFilterKeys.filter((key) => !(0, exports.filterKeyReferencesDifferentTable)(key));
        whereOptions.push(...buildWhereFilterList(directFieldKeys, referencedRegistry, currentFilterData));
    }
    return whereOptions;
};
const generateWhereFiltersV2 = (domainName, possibleFilter) => {
    const mainTableRegistry = (0, exports.getRegistryByDomainName)(domainName);
    const filterData = mainTableRegistry.parseFilter(possibleFilter);
    const referenceGraphHandler = (0, reference_graph_1.createDomainReferenceHandler)(domainName, filterData);
    const referenceChains = referenceGraphHandler.getReferenceChains();
    // Get main table keys
    const filterKeys = mainTableRegistry.parseDomainKeys(filterData);
    const mainTableKeys = filterKeys.filter((key) => !(0, exports.filterKeyReferencesDifferentTable)(key));
    const whereOptions = [...buildWhereFilterList(mainTableKeys, mainTableRegistry, filterData)];
    // Process each reference chain
    for (const chain of referenceChains) {
        whereOptions.push(...getWhereFiltersByReferenceChains(filterData, chain));
    }
    return whereOptions;
};
exports.generateWhereFiltersV2 = generateWhereFiltersV2;
const generateWhereFilters = (domainName, possibleFilter) => {
    const mainTableRegistry = (0, exports.getRegistryByDomainName)(domainName);
    const filterData = mainTableRegistry.parseFilter(possibleFilter);
    const filterKeys = mainTableRegistry.parseDomainKeys(filterData);
    const referencedDomains = filterKeys.filter((k) => (0, exports.filterKeyReferencesDifferentTable)(k));
    const referencedDomainRegistries = mapDomainNameToRegistries(referencedDomains);
    const mainTableKeys = filterKeys.filter((key) => !referencedDomains.includes(key));
    const whereOptions = [...buildWhereFilterList(mainTableKeys, mainTableRegistry, filterData)];
    // Stack-based approach for nested tables
    const nestedTableStack = initializeNestedTableStack(referencedDomainRegistries, filterData);
    // Closure function to push nested tables onto stack
    const pushNestedTablesOntoStack = (nestedReferencedDomainRegistries, currentFilterData) => {
        for (const nestedRegistry of nestedReferencedDomainRegistries) {
            // Find the domain name that maps to this registry's table name
            const domainNameForRegistry = Object.keys(config_1.WhereFilterConfigurations).find((domainName) => config_1.WhereFilterConfigurations[domainName].tableName === nestedRegistry.tableName);
            if (domainNameForRegistry) {
                const nestedFilterData = nestedRegistry.parseFilter(currentFilterData[domainNameForRegistry]);
                nestedTableStack.push({ registry: nestedRegistry, filterData: nestedFilterData });
            }
        }
    };
    // Process stack until empty
    while (nestedTableStack.length) {
        const { registry, filterData: currentFilterData } = nestedTableStack.pop();
        const currentFilterKeys = registry.parseDomainKeys(currentFilterData);
        const nestedReferencedDomains = currentFilterKeys.filter((k) => (0, exports.filterKeyReferencesDifferentTable)(k));
        const nestedReferencedDomainRegistries = mapDomainNameToRegistries(nestedReferencedDomains);
        const directFieldKeys = currentFilterKeys.filter((key) => !nestedReferencedDomains.includes(key));
        // Process direct fields
        whereOptions.push(...buildWhereFilterList(directFieldKeys, registry, currentFilterData));
        // Push nested referenced tables onto stack for next iteration
        pushNestedTablesOntoStack(nestedReferencedDomainRegistries, currentFilterData);
    }
    return whereOptions;
};
exports.generateWhereFilters = generateWhereFilters;

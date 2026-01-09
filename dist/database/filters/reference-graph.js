"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDomainReferenceHandler = exports.createReferenceGraph = void 0;
const where_filter_1 = require("./where-filter");
const queue_1 = require("../../data-stuctures/queue");
const getAllReferenceKeys = (registry, filter) => {
    const filterKeys = registry.parseDomainKeys(filter);
    return filterKeys.filter((key) => (0, where_filter_1.filterKeyReferencesDifferentTable)(key));
};
const asRecord = (v) => {
    if (v && typeof v === "object" && !Array.isArray(v))
        return v;
    return null;
};
const createReferenceGraph = (rootDomain, rootFilter) => {
    const graph = {};
    const visited = new Set();
    const queue = (0, queue_1.createLinkedQueue)();
    queue.enqueue({ domain: rootDomain, filter: rootFilter });
    while (!queue.isEmpty()) {
        const { domain: currentDomain, filter: currentFilter } = queue.dequeue();
        if (visited.has(currentDomain))
            continue;
        visited.add(currentDomain);
        const registry = (0, where_filter_1.getRegistryByDomainName)(currentDomain);
        const refKeys = getAllReferenceKeys(registry, currentFilter);
        const neighbors = [];
        for (const key of refKeys) {
            if (key === currentDomain)
                continue;
            neighbors.push(key);
            // Important: traverse into nested JSON for that reference if it exists
            const nested = asRecord(currentFilter[key]);
            if (nested && !visited.has(key)) {
                queue.enqueue({ domain: key, filter: nested });
            }
            else if (!visited.has(key)) {
                queue.enqueue({ domain: key, filter: {} });
            }
        }
        graph[currentDomain] = neighbors;
    }
    return graph;
};
exports.createReferenceGraph = createReferenceGraph;
const createDomainReferenceHandler = (domainName, filter) => {
    const adjacencyGraph = (0, exports.createReferenceGraph)(domainName, filter);
    const getReferenceChains = () => {
        const results = [];
        const path = [];
        const inPath = new Set(); // cycle guard for current DFS stack
        const dfs = (node) => {
            path.push(node);
            inPath.add(node);
            const neighbors = adjacencyGraph[node] ?? [];
            // Only traverse neighbors that don't create a cycle in the current path
            const next = neighbors.filter((n) => !inPath.has(n));
            // If no valid next step, this is a "leaf" for our purposes
            if (next.length === 0) {
                results.push([...path]);
            }
            else {
                for (const nxt of next)
                    dfs(nxt);
            }
            inPath.delete(node);
            path.pop();
        };
        dfs(domainName);
        return results;
    };
    return {
        mainDomain: domainName,
        getReferenceChains,
        nextReference: (currentDomainName) => adjacencyGraph[currentDomainName]
    };
};
exports.createDomainReferenceHandler = createDomainReferenceHandler;

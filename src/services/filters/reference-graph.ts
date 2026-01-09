import {filterKeyReferencesDifferentTable, getRegistryByDomainName, WhereFilterRegistry} from "./where-filter";
import {createLinkedQueue, DoubleLinkedQueue} from "../../data-stuctures/queue";

type DomainReferenceAdjacencyGraph = {
    [domainName: string]: string[];
};
type DomainFilterNode = {
    domain: string;
    filter: Record<string, unknown>;
};
type DomainReferenceHandler = {
    mainDomain: string
    nextReference: (domainName: string) => string[];
    getReferenceChains: () => string[][];
}

const getAllReferenceKeys = (registry: WhereFilterRegistry, filter: Record<string, unknown>): string[] => {
    const filterKeys = registry.parseDomainKeys(filter);
    return filterKeys.filter((key) => filterKeyReferencesDifferentTable(key));
}
const asRecord = (v: unknown): Record<string, unknown> | null => {
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
    return null;
};
export const createReferenceGraph = (
    rootDomain: string,
    rootFilter: Record<string, unknown>
): DomainReferenceAdjacencyGraph => {
    const graph: DomainReferenceAdjacencyGraph = {};
    const visited = new Set<string>();
    const queue: DoubleLinkedQueue<DomainFilterNode> = createLinkedQueue<DomainFilterNode>();
    queue.enqueue({domain: rootDomain, filter: rootFilter});
    while (!queue.isEmpty()) {
        const {domain: currentDomain, filter: currentFilter} = queue.dequeue()!;
        if (visited.has(currentDomain)) continue;
        visited.add(currentDomain);
        const registry = getRegistryByDomainName(currentDomain);
        const refKeys = getAllReferenceKeys(registry, currentFilter);
        const neighbors: string[] = [];
        for (const key of refKeys) {
            if (key === currentDomain) continue;
            neighbors.push(key);
            // Important: traverse into nested JSON for that reference if it exists
            const nested = asRecord(currentFilter[key]);
            if (nested && !visited.has(key)) {
                queue.enqueue({domain: key, filter: nested});
            } else if (!visited.has(key)) {
                queue.enqueue({domain: key, filter: {}});
            }
        }

        graph[currentDomain] = neighbors;
    }

    return graph;
};

export const createDomainReferenceHandler = (domainName: string, filter: Record<string, unknown>): DomainReferenceHandler => {
    const adjacencyGraph = createReferenceGraph(domainName, filter);
    const getReferenceChains = (): string[][] => {
        const results: string[][] = [];
        const path: string[] = [];
        const inPath = new Set<string>(); // cycle guard for current DFS stack

        const dfs = (node: string) => {
            path.push(node);
            inPath.add(node);

            const neighbors = adjacencyGraph[node] ?? [];

            // Only traverse neighbors that don't create a cycle in the current path
            const next = neighbors.filter((n) => !inPath.has(n));

            // If no valid next step, this is a "leaf" for our purposes
            if (next.length === 0) {
                results.push([...path]);
            } else {
                for (const nxt of next) dfs(nxt);
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
        nextReference: (currentDomainName: string): string[] => adjacencyGraph[currentDomainName]
    }
}
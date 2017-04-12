import { IDiffResult } from "diff";

export type Substitution = { insertion?: IDiffResult, removal?: IDiffResult };
export type Unchanged = IDiffResult & { added: false, removed: false };
export function isDiffResult(item: IDiffResult | Substitution): item is IDiffResult {
    return !!(<IDiffResult>item).value;
}

export function isUnchanged(diff: IDiffResult): diff is Unchanged {
    return !diff.added && !diff.removed;
}

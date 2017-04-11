import { IDiffResult } from "diff";
import * as _ from "lodash";

export function undo(substitution: Substitution): Unchanged {
    const removal = substitution.removal;
    return {
        removed: false,
        added: false,
        count: removal ? removal.count : 0,
        value: removal ? removal.value : ''
    };
}

export type Substitution = { insertion?: IDiffResult, removal?: IDiffResult };
export type Unchanged = IDiffResult & { added: false, removed: false };
export type SubstitutionPredicate = (substitution: Substitution) => boolean;
export function filter(predicate: SubstitutionPredicate, parts: IDiffResult[]) {

    let state: Substitution | undefined;
    const filtered = parts
        .reduce((net, curr) => {
            if (isUnchanged(curr)) {
                const update = state
                    ? [
                        predicate(state)
                            ? state
                            : undo(state),
                        curr
                    ]
                    : [curr];
                state = undefined;
                return [...net, ...update];
            }

            const stateUpdate: Substitution = curr.added ? { insertion: curr } : { removal: curr };
            state = { ...(state ? state : {}), ...stateUpdate };
            return net;
        }, <(Unchanged | Substitution)[]>[]);

    return _.flatMap(filtered, item => {
        if (isDiffResult(item) && isUnchanged(item)) {
            return [item];
        }

        const { insertion, removal } = item;
        const result: IDiffResult[] = [];

        if (removal) {
            result.push(removal);
        }
        if (insertion) {
            result.push(insertion);
        }
        return result;
    })
}

function isDiffResult(item: IDiffResult | Substitution): item is IDiffResult {
    return (<IDiffResult>item).value !== undefined;
}

function isUnchanged(diff: IDiffResult): diff is Unchanged {
    return !diff.added && !diff.removed;
}

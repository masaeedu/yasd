import { error } from 'util';
import { isUnchanged } from './common';
import { IDiffResult, IHunk, IUniDiff } from "diff";
import * as _ from "lodash";

export type CoalescedDiff = { before: string, after: string };

export function coalesceHunk(hunk: IHunk): CoalescedDiff {
    // Splice newline information with the line content and parse into diff results
    const parts = _.zip(hunk.lines, <string[]>hunk["linedelimiters"])
        .map(([line, delimiter]) => line.concat(delimiter))
        .map(parseLine);
    return coalesceDiffResultSequence(parts);
}

type LinePrefix = '+' | '-' | undefined;
function getPrefix(line: string): LinePrefix {
    const char = line.charAt(0);
    if (char === '+' || char === '-')
        return char;
}

function parseLine(line: string): IDiffResult {
    const prefix = getPrefix(line);
    const value = line.slice(1);
    return {
        added: prefix === '+',
        removed: prefix === '-',
        count: value.length,
        value: value
    }
}

export function coalesceDiffResultSequence(parts: IDiffResult[]): CoalescedDiff {
    return parts
        .reduce<CoalescedDiff>((net, curr) => {
            // Unchanged items should be appended to both coalesced values
            if (isUnchanged(curr)) {
                return { before: net.before + curr.value, after: net.after + curr.value };
            }
            if (curr.removed) {
                return { after: net.after, before: net.before + curr.value };
            }
            if (curr.added) {
                return { before: net.before, after: net.after + curr.value };
            }

            throw new Error("Invalid diff item provided. At least one of added or removed must be false.");
        }, { before: '', after: '' });
}

import { error } from 'util';
import { isUnchanged } from './common';
import { IDiffResult, IHunk, IUniDiff } from "diff";
import * as _ from "lodash";

export type Comparison = { before: string, after: string };

export function compareHunk(hunk: IHunk): Comparison {
    // Splice newline information with the line content and parse into diff results
    const parts = _.zip(hunk.lines, <string[]>hunk["linedelimiters"])
        .map(([line, delimiter]) => line.concat(delimiter))
        .map(parseLine);
    return compareDiffResultSequence(parts);
}

export function compareDiffResultSequence(parts: IDiffResult[]): Comparison {
    return parts
        .reduce<Comparison>((net, curr) => {
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

function serializeDiff(diff: IUniDiff) {
    return [
        diff.oldHeader,
        diff.newHeader,
        `--- ${diff.oldFileName}`,
        `+++ ${diff.newFileName}`,
        ...diff.hunks.map(serializeHunk)
    ].join();
}
function serializeHunk(hunk: IHunk) {
    return [
        `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
        ...hunk.lines
    ].join();
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

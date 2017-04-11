import { IDiffResult, IHunk } from "diff";
import * as _ from "lodash";


export enum ViewType {
    Original,
    Modified
}
export function coalesce(type: ViewType, parts: IDiffResult[]) {
    return parts
        .filter(x => type === ViewType.Original ? !x.added : !x.removed)
        .map(diff => diff.value)
        .reduce((net, curr) => net + curr);
}


type ParsedHunk = { hunk: IHunk, before: string, after: string };
export function parseHunk(hunk: IHunk): ParsedHunk {
    // Splice newline information with the line content
    const lines = _.zip(hunk.lines, <string[]>hunk["linedelimiters"])
        .map(([line, delimiter]) => line.concat(delimiter))
        .map(parseLine);

    // Construct before and after versions from the hunk lines
    const [before, after] = [coalesce(ViewType.Original, lines), coalesce(ViewType.Modified, lines)];

    // Perform a diff
    return {
        hunk,
        before,
        after
    };
}

type LinePrefix = '+' | '-' | undefined
function getPrefix(line: string): LinePrefix {
    const char = line.charAt(0);
    if (char === '+' || char === '-')
        return char;
}

function parseLine(line: string): IDiffResult {
    const prefix = getPrefix(line);
    const value = prefix ? line.slice(1) : line;
    return {
        added: prefix === '+',
        removed: prefix === '-',
        count: value.length,
        value: value
    }
}
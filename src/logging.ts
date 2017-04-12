import * as chalk from 'chalk';
import { IDiffResult } from "diff";

function prepareDiffResultContentForLogging(value: string) {
    // const ellipsisContext = 50;
    // value = value.length > 3 + ellipsisContext * 2 ? `${value.slice(0, ellipsisContext)}...${value.slice(value.length - ellipsisContext, value.length)}` : value;

    value = JSON.stringify(value); // Ensure escape characters are rendered literally
    value = value.slice(1, value.length - 1); // Strip outer quotes
    return value;
}

export function renderDiffResults(parts: IDiffResult[]) {
    const output = parts.reduce((total, part) => {
        const color = part.added ? chalk.bgGreen.white : part.removed ? chalk.bgRed.white : chalk.stripColor;
        let value = prepareDiffResultContentForLogging(part.value);
        return total + color(value);
    }, '');
    return output;
}
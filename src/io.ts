import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { readFileSync, writeFileSync } from 'fs';
import { createPatch, parsePatch, IHunk, IUniDiff } from "diff";
import { ParsedPath } from "path";

export function getInput(filename: string) {
    const file = readFileSync(filename, 'utf-8');
    return parsePatch(file);
}

type Destination = {
    save: (sourceFile: string, revisedPatch: string) => void;
}
export function getDestination(outputDir: string): Destination {
    return {
        save(sourceFile, revisedPatch) {
            const target = path.parse(sourceFile);

            const dir = path.join(outputDir, target.dir);
            const outputFile = path.join(
                dir,
                `${target.base}.patch`);

            mkdirp.sync(dir);
            writeFileSync(outputFile, revisedPatch);
        }
    }
}

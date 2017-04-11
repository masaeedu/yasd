import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { readFileSync, writeFileSync } from 'fs';
import { parsePatch, IHunk, IUniDiff } from "diff";
import { ParsedPath } from "path";

export function getInput(filename: string) {
    const file = readFileSync(filename, 'utf-8');
    return parsePatch(file);
}

type Destination = {
    saveRevisedPatchFile: (patch: string) => void;
}
export function getDestination(outputDir: string): Destination {
    return {
        saveRevisedPatchFile(patch) {
            const diffs = parsePatch(patch);

            diffs.map(diff => {
                const target = path.parse(diff.oldFileName);

                const dir = path.join(outputDir, target.dir);
                const hunks = diff.hunks;
                hunks.map(hunk => {
                    const fileName = path.join(
                        dir,
                        `${target.name}-${hunk.oldStart}+${hunk.newStart}${target.ext}.patch`);
                    mkdirp.sync(dir);
                    writeFileSync(fileName, patch);
                })
            });
        }
    }
}

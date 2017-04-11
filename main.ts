import { getDestination, getInput } from './io';
import { filter, undo, SubstitutionPredicate } from './modification';
import { coalesce, parseHunk, ViewType } from './conversion';
import { renderDiffResults } from './logging';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { createTwoFilesPatch, applyPatch, parsePatch, diffWordsWithSpace, IHunk, IDiffResult } from 'diff';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { identity, range, flatten, prop, map, addIndex, compose, splitWhen } from 'ramda';
import { Observable } from 'rxjs';
import * as chalk from 'chalk';
import * as _ from 'lodash';

import { addListener, mainStory } from 'storyboard';
import 'storyboard-preset-console';

const filePath = `D:/temp/andyma.diff`;
const diffs = getInput(filePath);
const destination = getDestination(`D:/temp/results`);

const predicates: { [idx: string]: SubstitutionPredicate } = {
    "whitespace": ({ insertion, removal }) => (!removal || /^\s*$/.test(removal.value)) && (!insertion || /^\s*$/.test(insertion.value)),
    // sshToWindowsPredicate: (removed, added) => removed && added && /^SSHRemoteSystemCommand$/.test(removed.value) && /^RemoteSystemCommand$/.test(added.value)
}

const predicate = predicates["whitespace"];
for (let diff of diffs) {
    let revised = '';
    const parsedHunks = diff.hunks.map(parseHunk);

    for (let parsedHunk of parsedHunks) {
        const parts = diffWordsWithSpace(parsedHunk.before, parsedHunk.after);
        const filtered = filter(predicate, parts);
        if (filtered.some(part => !!(part.added || part.removed))) {
            // story.info('filtered', renderDiffResults(filtered));
            const original = _.repeat('\n', parsedHunk.hunk.oldStart) + parsedHunk.before;
            const modified = _.repeat('\n', parsedHunk.hunk.newStart) + coalesce(ViewType.Modified, filtered);
            const patch = createTwoFilesPatch(diff.oldFileName, diff.newFileName, original, modified, diff.oldHeader, diff.newHeader, { context: 0 });
            // story.info('newpatch', patch);
            revised += patch;
        }
    }
    if (revised) {
        const story = mainStory.child({ title: diff.newFileName });
        story.info('revised patch', revised);
        destination.saveRevisedPatchFile(revised);
        story.close();
    }
}


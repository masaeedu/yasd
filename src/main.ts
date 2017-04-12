import { isUnchanged } from './common';
import { getDestination, getInput } from './io';
import { filterDiffResults, undo, SubstitutionPredicate } from './modification';
import { coalesceDiffResultSequence, coalesceHunk } from './conversion';
import { renderDiffResults } from './logging';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { createTwoFilesPatch, applyPatch, parsePatch, diffWordsWithSpace, IHunk, IDiffResult, structuredPatch, IUniDiff, diffChars } from 'diff';
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
    nonwhitespace: ({ insertion, removal }) => (!removal || /\S/.test(removal.value)) && (!insertion || /\S/.test(insertion.value)),
    xmlnswrap: ({ insertion, removal }) => !!(insertion && removal && diffChars(insertion.value, removal.value).every(diff => isUnchanged(diff) || !/\S/.test(diff.value)))
    // sshToWindowsPredicate: (removed, added) => removed && added && /^SSHRemoteSystemCommand$/.test(removed.value) && /^RemoteSystemCommand$/.test(added.value)
}

const predicate = predicates.nonwhitespace;

// Each patch consists of not necessarily contiguous changed regions, known as "hunks"
for (let diff of diffs) {
    const story = mainStory.child({ title: diff.newFileName });

    // Each hunk describes the changes to a range of lines in the file, using a prefix (+, - or space). The range described in
    // the hunk is usually centered on modified lines, and is padded by some number of unchanged lines, known as context
    for (let originalHunk of diff.hunks) {
        const originalChange = coalesceHunk(originalHunk);

        // Our goal is to filter out changes of interest across hunks using user-supplied predicates. Changes of interest need
        // to be accumulated back into revised hunks, with appropriately adjusted line-number headers, after which the hunk 
        // sequence can be serialized into a revised patch
        const parts = diffWordsWithSpace(originalChange.before, originalChange.after);
        const filteredDiffResults = filterDiffResults(predicate, parts);
        const filteredChange = coalesceDiffResultSequence(filteredDiffResults);

        if (filteredDiffResults.some(part => !isUnchanged(part))) {
            // const rendered = {
            //     "original": renderDiffResults(diffResults),
            //     "filtered": renderDiffResults(filteredDiffResults),
            //     "roundtrip": renderDiffResults(diffWordsWithSpace(filteredAggregate.before, filteredAggregate.after))
            // }
            // _.each(rendered, (v, k) => story.info(k, v));

            // if (rendered["filtered"] !== rendered["roundtrip"]) {
            //     throw new Error("Round tripped diff -> coalesce -> diff should produce same result as first diff");
            // }

            const originalFile = _.repeat('\n', originalHunk.oldStart - 1) + filteredChange.before;
            const modifiedFile = _.repeat('\n', originalHunk.oldStart - 1) + filteredChange.after;

            const patch = createTwoFilesPatch(diff.oldFileName, diff.newFileName, originalFile, modifiedFile, diff.oldHeader, diff.newHeader, { context: 0 });
            story.info('revised patch', patch);
            destination.save(diff.oldFileName, patch);
        }
    }

    story.close();
}


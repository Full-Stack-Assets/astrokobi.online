#!/usr/bin/env node
/**
 * Git merge driver for content/.topic-log.json.
 *
 * Every hourly run appends one entry to this single JSON file, so any two
 * interleaved writes to the branch (a re-run, or a PR merge landing mid-run)
 * collide and a plain rebase cannot auto-merge them — which previously failed
 * the whole run. This driver unions both sides instead: keep every unique
 * topic (by slug), most-recent last, capped at 500.
 *
 * Registered as a merge driver in .github/workflows/generate.yml and mapped via
 * .gitattributes. Git invokes it as: node merge-topic-log.mjs %O %A %B
 *   argv[2] = %O ancestor, argv[3] = %A ours (written in place), argv[4] = %B theirs
 * Writing the merged result to %A and exiting 0 marks the conflict resolved.
 */
import fs from 'node:fs';

const oursPath = process.argv[3];
const theirsPath = process.argv[4];

function load(path) {
  try {
    const parsed = JSON.parse(fs.readFileSync(path, 'utf8'));
    return Array.isArray(parsed.topics) ? parsed.topics : [];
  } catch {
    return [];
  }
}

const seen = new Set();
const merged = [];
for (const entry of [...load(oursPath), ...load(theirsPath)]) {
  const key = entry && (entry.slug || entry.signature);
  if (!key || seen.has(key)) continue;
  seen.add(key);
  merged.push(entry);
}

fs.writeFileSync(oursPath, JSON.stringify({ topics: merged.slice(-500) }, null, 2) + '\n');
process.exit(0);

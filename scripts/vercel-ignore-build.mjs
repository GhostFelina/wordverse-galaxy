import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const documentation = (file) =>
  /^(docs\/|\.github\/(ISSUE_TEMPLATE\/|PULL_REQUEST_TEMPLATE\.md$))/.test(file) ||
  /^(README(?:\.[a-z]+)?\.md|AGENTS\.md|CLAUDE\.md|ATTRIBUTIONS\.md|CHANGELOG\.md|CONTRIBUTING\.md|SECURITY\.md|TODO\.md)$/.test(
    file,
  );
export function documentationOnly(files, beforeConfig, afterConfig) {
  if (!files.length) return false;
  if (
    files.some(
      (file) =>
        !documentation(file) &&
        !['vercel.json', 'scripts/vercel-ignore-build.mjs', 'tests/vercel-ignore-build.test.js'].includes(file),
    )
  )
    return false;
  if (files.includes('vercel.json')) {
    if (!beforeConfig || !afterConfig || afterConfig.ignoreCommand !== 'node scripts/vercel-ignore-build.mjs')
      return false;
    const before = { ...beforeConfig },
      after = { ...afterConfig };
    delete before.ignoreCommand;
    delete after.ignoreCommand;
    if (JSON.stringify(before) !== JSON.stringify(after)) return false;
  }
  return true;
}
export function ignoredBuildDecision(
  git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }),
) {
  try {
    const files = git(['diff', '--name-only', '-z', 'HEAD^', 'HEAD']).split('\0').filter(Boolean);
    const before = files.includes('vercel.json') ? JSON.parse(git(['show', 'HEAD^:vercel.json'])) : null;
    const after = files.includes('vercel.json') ? JSON.parse(git(['show', 'HEAD:vercel.json'])) : null;
    return documentationOnly(files, before, after) ? 0 : 1;
  } catch {
    return 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const code = ignoredBuildDecision();
  console.log(
    code === 0 ? 'Documentation-only commit: keep the current deployment.' : 'Application or unknown change: build.',
  );
  process.exitCode = code;
}

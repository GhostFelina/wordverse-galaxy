// Format exactly the files covered by `npm run format:check`, so both commands share one list.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = scripts['format:check'].split(/\s+/).filter((part) => part && part !== 'prettier' && part !== '--check');
const result = spawnSync(process.execPath, ['node_modules/prettier/bin/prettier.cjs', '--write', ...files], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);

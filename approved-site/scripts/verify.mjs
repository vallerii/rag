import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'site/index.html'), 'utf8');
const names = [...html.matchAll(/data-approved-block="([^"]+)"/g)].map(match => match[1]);
if (names.join(',') !== 'header,hero,maps,offer,search') throw Error('Approved section order is incorrect');
const main = html.match(/src="\/(assets\/index-ortsfuchs-[^"?]+\.js)"/)?.[1];
if (!main) throw Error('Versioned homepage entry is missing');
for (const file of ['ortsfuchs/approved-blocks.js', main]) execFileSync(process.execPath, ['--check', path.join(root, 'site', file)]);
for (const match of html.matchAll(/(?:src|href)="(\/(?:assets|ortsfuchs|recto|rag-photos|brands)\/[^"?#]+)"/g)) {
  if (!fs.existsSync(path.join(root, 'site', match[1]))) throw Error('Missing homepage asset: ' + match[1]);
}
console.log('Approved production snapshot verified.');

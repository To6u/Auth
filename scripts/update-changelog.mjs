#!/usr/bin/env node
// Читает .changelog-draft.json, вставляет записи в projects.data.ts после маркера // CHANGELOG_INSERT,
// стейджит файл и удаляет драфт.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DRAFT_PATH = resolve(ROOT, '.changelog-draft.json');
const DATA_PATH = resolve(ROOT, 'client/src/pages/profile/components/projects/projects.data.ts');
const MARKER = '// CHANGELOG_INSERT';

if (!existsSync(DRAFT_PATH)) process.exit(0);

const draft = JSON.parse(readFileSync(DRAFT_PATH, 'utf8'));
if (!Array.isArray(draft) || draft.length === 0) process.exit(0);

const lines = draft
    .map(({ text, date }) => `            { text: '${text}', date: '${date}' },`)
    .join('\n');

const source = readFileSync(DATA_PATH, 'utf8');
if (!source.includes(MARKER)) {
    console.error(`[changelog] Маркер "${MARKER}" не найден в projects.data.ts`);
    process.exit(1);
}

const updated = source.replace(MARKER, `${MARKER}\n${lines}`);
writeFileSync(DATA_PATH, updated, 'utf8');
execSync(`git add "${DATA_PATH}"`);

unlinkSync(DRAFT_PATH);
console.log(`[changelog] Добавлено ${draft.length} записей`);

#!/usr/bin/env node
// commit-msg хук: извлекает описание из conventional commit и вставляет в projects.data.ts
// Использование: node scripts/update-changelog.mjs <путь_к_файлу_с_сообщением>

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DATA_PATH = resolve(ROOT, 'client/src/pages/profile/components/projects/projects.data.ts');
const MARKER = '// CHANGELOG_INSERT';
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const msgFile = process.argv[2];
const msgSource = process.argv[3]; // message | template | merge | squash | commit
if (!msgFile) process.exit(0);
if (msgSource && msgSource !== 'message' && msgSource !== 'template') process.exit(0);

const firstLine = readFileSync(msgFile, 'utf8').trim().split('\n')[0];

// Conventional commit: feat(scope): description  →  description
const match = firstLine.match(/^[a-z]+(?:\([^)]+\))?!?:\s*(.+)$/);
if (!match) process.exit(0);

const description = match[1].trim().replace(/'/g, "\\'");
const d = new Date();
const date = `${d.getDate()} ${MONTHS[d.getMonth()]}`;

const source = readFileSync(DATA_PATH, 'utf8');
if (!source.includes(MARKER)) {
    console.error(`[changelog] Маркер "${MARKER}" не найден в projects.data.ts`);
    process.exit(0);
}

const MAX_ENTRIES = 10;
const entry = `            { text: '${description}', date: '${date}' },`;

// Вставляем новую запись после маркера, затем обрезаем до MAX_ENTRIES
let updated = source.replace(MARKER, `${MARKER}\n${entry}`);

const markerIdx = updated.indexOf(MARKER);
const afterMarker = updated.indexOf('\n', markerIdx) + 1;
const changelogEnd = updated.indexOf(']', afterMarker);
const entriesBlock = updated.slice(afterMarker, changelogEnd);
const lines = entriesBlock.split('\n').filter(l => l.trim().startsWith('{'));
if (lines.length > MAX_ENTRIES) {
    const trimmed = lines.slice(0, MAX_ENTRIES).join('\n') + '\n';
    updated = updated.slice(0, afterMarker) + trimmed + updated.slice(changelogEnd);
}

writeFileSync(DATA_PATH, updated, 'utf8');
execSync(`git add "${DATA_PATH}"`);
console.log(`[changelog] ${description} (${date})`);

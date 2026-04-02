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
if (!msgFile) process.exit(0);

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

const entry = `            { text: '${description}', date: '${date}' },`;
const updated = source.replace(MARKER, `${MARKER}\n${entry}`);
writeFileSync(DATA_PATH, updated, 'utf8');
execSync(`git add "${DATA_PATH}"`);
console.log(`[changelog] ${description} (${date})`);

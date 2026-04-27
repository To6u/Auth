#!/usr/bin/env node
// post-commit хук: читает сообщение последнего коммита, добавляет запись в projects.data.ts,
// амендит коммит. CHANGELOG_AMENDING=1 предотвращает рекурсию.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DATA_PATH = resolve(ROOT, 'client/src/pages/profile/components/projects/projects.data.ts');
const MARKER = '// CHANGELOG_INSERT';
const MAX_ENTRIES = 10;
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const firstLine = execSync('git log -1 --format=%s HEAD', { cwd: ROOT }).toString().trim();

// Conventional commit: feat(scope): description → description
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
let updated = source.replace(MARKER, `${MARKER}\n${entry}`);

// Обрезаем до MAX_ENTRIES.
// Используем brace-depth tracking вместо построчного фильтра —
// иначе multi-line объекты (после Biome lineWidth=100) будут сломаны.
const markerIdx = updated.indexOf(MARKER);
const afterMarker = updated.indexOf('\n', markerIdx) + 1;
const changelogEnd = updated.indexOf(']', afterMarker);
const slice = updated.slice(afterMarker, changelogEnd);

let depth = 0;
let count = 0;
let cutPos = -1;

for (let i = 0; i < slice.length; i++) {
    if (slice[i] === '{') {
        depth++;
    } else if (slice[i] === '}') {
        depth--;
        if (depth === 0) {
            count++;
            if (count === MAX_ENTRIES) {
                // Включаем запятую и символ новой строки
                let end = i + 1;
                if (slice[end] === ',') end++;
                while (end < slice.length && slice[end] !== '\n') end++;
                if (end < slice.length) end++; // включаем \n
                cutPos = end;
                break;
            }
        }
    }
}

if (cutPos !== -1) {
    // Проверяем, есть ли ещё объекты после cutPos
    let hasMore = false;
    for (let i = cutPos; i < slice.length; i++) {
        if (slice[i] === '{') { hasMore = true; break; }
    }
    if (hasMore) {
        updated = updated.slice(0, afterMarker) + slice.slice(0, cutPos) + updated.slice(changelogEnd);
    }
}

writeFileSync(DATA_PATH, updated, 'utf8');
execSync(`git add "${DATA_PATH}"`, { cwd: ROOT });
execSync('git commit --amend --no-edit', {
    cwd: ROOT,
    env: { ...process.env, CHANGELOG_AMENDING: '1' },
});
console.log(`[changelog] ${description} (${date})`);

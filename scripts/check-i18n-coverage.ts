#!/usr/bin/env bun
/**
 * check-i18n-coverage.ts - CI-safe locale value coverage check.
 *
 * Parity is handled by check-i18n-parity.ts. This script verifies that every
 * locale value is a non-empty string and that non-English translations preserve
 * the interpolation variables required by en.json.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LOCALES_DIR = resolve(
  import.meta.dir ?? new URL('.', import.meta.url).pathname,
  '..',
  'packages',
  'shared',
  'src',
  'i18n',
  'locales',
)

type Locale = Record<string, unknown>

const PLURAL_SUFFIX = /_(?:zero|one|two|few|many|other)$/
const INTERPOLATION = /\{\{(\w+)\}\}/g

function pluralBase(key: string): string {
  return key.replace(PLURAL_SUFFIX, '')
}

function isPluralKey(key: string): boolean {
  return PLURAL_SUFFIX.test(key)
}

function extractVars(value: string): string[] {
  return [...value.matchAll(INTERPOLATION)]
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value))
    .sort()
}

function loadLocale(file: string): Locale {
  return JSON.parse(readFileSync(resolve(LOCALES_DIR, file), 'utf-8')) as Locale
}

const localeFiles = readdirSync(LOCALES_DIR)
  .filter((file) => file.endsWith('.json'))
  .sort()

const en = loadLocale('en.json')
const errors: string[] = []

for (const file of localeFiles) {
  const locale = loadLocale(file)
  for (const [key, value] of Object.entries(locale)) {
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`${file}: ${key} must be a non-empty string`)
    }
  }
}

for (const file of localeFiles.filter((file) => file !== 'en.json')) {
  const locale = loadLocale(file)
  for (const [key, value] of Object.entries(locale)) {
    if (typeof value !== 'string') continue

    let referenceKey = key
    if (!(referenceKey in en) && isPluralKey(referenceKey)) {
      referenceKey = `${pluralBase(referenceKey)}_one`
    }

    const referenceValue = en[referenceKey]
    if (typeof referenceValue !== 'string') continue

    const expectedVars = extractVars(referenceValue)
    const actualVars = extractVars(value)
    if (expectedVars.join(',') !== actualVars.join(',')) {
      errors.push(
        `${file}: ${key} interpolation mismatch (expected ${expectedVars.join(',') || 'none'}, got ${actualVars.join(',') || 'none'})`,
      )
    }
  }
}

if (errors.length) {
  console.error('i18n coverage check failed:')
  for (const error of errors.slice(0, 50)) console.error(`  ${error}`)
  if (errors.length > 50) console.error(`  ...and ${errors.length - 50} more`)
  process.exit(1)
}

console.log(`i18n coverage OK (${localeFiles.length} locales)`)

import { db } from '../utils/db'
import { generateId } from '../utils/id'

export interface Term {
  id: string
  source: string
  target: string
  createdAt: number
  updatedAt: number
}

export async function getAllTerms(): Promise<Term[]> {
  return db.terms.toArray()
}

export async function getTerm(id: string): Promise<Term | undefined> {
  return db.terms.get(id)
}

export async function addTerm(source: string, target: string): Promise<Term> {
  const now = Date.now()
  const term: Term = {
    id: generateId('term'),
    source,
    target,
    createdAt: now,
    updatedAt: now,
  }
  await db.terms.put(term)
  return term
}

export async function updateTerm(id: string, source: string, target: string): Promise<Term | undefined> {
  const existing = await db.terms.get(id)
  if (!existing) return undefined
  const updated: Term = { ...existing, source, target, updatedAt: Date.now() }
  await db.terms.put(updated)
  return updated
}

export async function deleteTerm(id: string): Promise<void> {
  await db.terms.delete(id)
}

export async function matchTerms(text: string): Promise<Term[]> {
  const allTerms = await db.terms.toArray()
  const sorted = [...allTerms].sort((a, b) => b.source.length - a.source.length)
  const matched: Term[] = []
  const lowerText = text.toLowerCase()
  for (const term of sorted) {
    if (lowerText.includes(term.source.toLowerCase())) {
      matched.push(term)
    }
  }
  return matched
}

export async function importTermsFromJson(jsonStr: string): Promise<number> {
  const terms = JSON.parse(jsonStr) as Array<{ source: string; target: string }>
  const now = Date.now()
  let count = 0
  for (const item of terms) {
    if (item.source && item.target) {
      await db.terms.put({
        id: generateId('term'),
        source: item.source,
        target: item.target,
        createdAt: now,
        updatedAt: now,
      })
      count++
    }
  }
  return count
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0
  while (i < line.length) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i += 2
        } else {
          inQuotes = false
          i++
        }
      } else {
        current += ch
        i++
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
      } else if (ch === ',') {
        fields.push(current.trim())
        current = ''
        i++
      } else {
        current += ch
        i++
      }
    }
  }
  fields.push(current.trim())
  return fields
}

export async function importTermsFromCsv(csvStr: string): Promise<number> {
  const lines = csvStr.split('\n').filter((line) => line.trim())
  const now = Date.now()
  let count = 0
  for (const line of lines) {
    const fields = parseCsvLine(line)
    const source = fields[0]
    const target = fields[1]
    if (source && target) {
      await db.terms.put({
        id: generateId('term'),
        source,
        target,
        createdAt: now,
        updatedAt: now,
      })
      count++
    }
  }
  return count
}

export async function exportTermsToJson(): Promise<string> {
  const terms = await db.terms.toArray()
  return JSON.stringify(terms.map(({ source, target }) => ({ source, target })), null, 2)
}

export async function exportTermsToCsv(): Promise<string> {
  const terms = await db.terms.toArray()
  return terms.map(({ source, target }) => `"${source}","${target}"`).join('\n')
}

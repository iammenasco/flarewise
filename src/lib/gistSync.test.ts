import { describe, expect, it } from 'vitest'
import {
  backupContentFromGist,
  chooseBackupWinner,
  GIST_BACKUP_FILENAME,
} from './gistSync'
import {
  defaultPreferences,
  exportPreferences,
  importPreferences,
  prefsFromBackup,
} from './storage'

describe('chooseBackupWinner', () => {
  it('treats equal timestamps as equal', () => {
    const at = '2026-11-11T18:00:00.000Z'
    expect(chooseBackupWinner(at, at)).toBe('equal')
  })

  it('prefers the newer side', () => {
    expect(
      chooseBackupWinner(
        '2026-11-11T19:00:00.000Z',
        '2026-11-11T18:00:00.000Z',
      ),
    ).toBe('local')
    expect(
      chooseBackupWinner(
        '2026-11-11T18:00:00.000Z',
        '2026-11-11T19:00:00.000Z',
      ),
    ).toBe('remote')
  })

  it('treats missing timestamps as older', () => {
    expect(chooseBackupWinner(null, '2026-11-11T18:00:00.000Z')).toBe('remote')
    expect(chooseBackupWinner('2026-11-11T18:00:00.000Z', null)).toBe('local')
    expect(chooseBackupWinner(undefined, undefined)).toBe('equal')
  })

  it('ignores invalid timestamps', () => {
    expect(chooseBackupWinner('not-a-date', '2026-11-11T18:00:00.000Z')).toBe(
      'remote',
    )
  })
})

describe('preferences backup payload', () => {
  it('round-trips prefs and updatedAt', () => {
    const at = '2026-11-11T18:30:00.000Z'
    const raw = exportPreferences(
      {
        ...defaultPreferences,
        starredIds: ['chicken-broth'],
        personalStatus: { 'chicken-broth': 'safe' },
      },
      at,
    )
    const parsed = importPreferences(raw)
    expect(parsed).not.toBeNull()
    expect(parsed?.updatedAt).toBe(at)
    expect(parsed?.starredIds).toEqual(['chicken-broth'])
    expect(prefsFromBackup(parsed!).starredIds).toEqual(['chicken-broth'])
    expect('updatedAt' in prefsFromBackup(parsed!)).toBe(false)
  })

  it('accepts legacy backups without updatedAt', () => {
    const raw = JSON.stringify({
      ...defaultPreferences,
      starredIds: ['rice'],
    })
    const parsed = importPreferences(raw)
    expect(parsed?.starredIds).toEqual(['rice'])
    expect(parsed?.updatedAt).toBeUndefined()
  })
})

describe('backupContentFromGist', () => {
  it('prefers the canonical filename', () => {
    const content = exportPreferences(defaultPreferences, '2026-01-01T00:00:00.000Z')
    const found = backupContentFromGist({
      id: 'abc',
      files: {
        'other.json': { content: '{"nope":true}' },
        [GIST_BACKUP_FILENAME]: { content },
      },
    })
    expect(found).toBe(content)
  })

  it('falls back to the first file with content', () => {
    const found = backupContentFromGist({
      id: 'abc',
      files: {
        'legacy-backup.json': { content: '{"starredIds":[]}' },
      },
    })
    expect(found).toContain('starredIds')
  })
})

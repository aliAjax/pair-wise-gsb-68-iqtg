import type { Claim, SourceRecord } from '../types'

export const SOURCE_DIFF_FIELDS: Array<{ key: keyof SourceRecord; label: string }> = [
  { key: 'title', label: '来源标题' },
  { key: 'url', label: '公开地址' },
  { key: 'publisher', label: '发布机构' },
  { key: 'publishedAt', label: '发布日期' },
  { key: 'kind', label: '证据类型' },
  { key: 'contentHash', label: '内容哈希' },
  { key: 'chainOfCustody', label: '留档说明' }
]

/** 旧来源仍未被新材料更正时视为当前有效来源 */
export function isActiveSource(source: SourceRecord): boolean {
  return !source.supersededBy
}

export function diffSources(oldSource: SourceRecord, newSource: SourceRecord) {
  return SOURCE_DIFF_FIELDS.map(({ key, label }) => ({
    key,
    label,
    before: String(oldSource[key] ?? ''),
    after: String(newSource[key] ?? ''),
    changed: String(oldSource[key] ?? '') !== String(newSource[key] ?? '')
  }))
}

/** 在历史来源（已留档的旧来源）中按编号查找 */
export function findSourceInClaim(claim: Claim, sourceId: string): SourceRecord | undefined {
  for (const fact of claim.facts) {
    const hit = [...fact.sources, ...fact.counterSources].find((source) => source.id === sourceId)
    if (hit) return hit
  }
  return undefined
}

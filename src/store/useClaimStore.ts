import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedAudit, seedClaims, seedCorrections, seedPublishedSnapshots, seedVersions } from '../data/seed'
import type { AuditEntry, Claim, ClaimAnnotation, ClaimFact, FactConclusion, PublishedSnapshot, SourceCorrection, SourceRecord, VersionRecord } from '../types'

interface ClaimState {
  claims: Claim[]
  versions: VersionRecord[]
  audit: AuditEntry[]
  corrections: SourceCorrection[]
  publishedSnapshots: PublishedSnapshot[]
  keyword: string
  status: Claim['status'] | '全部'
  setKeyword: (value: string) => void
  setStatus: (value: Claim['status'] | '全部') => void
  addClaim: (input: { title: string; summary: string; reporter: string; priority: Claim['priority'] }) => Claim
  updateFact: (claimId: string, factId: string, patch: Partial<ClaimFact>) => void
  addFact: (claimId: string, text: string) => void
  addAnnotation: (claimId: string, factId: string, annotation: Omit<ClaimAnnotation, 'id' | 'createdAt' | 'resolved'>) => void
  resolveAnnotation: (claimId: string, factId: string, annotationId: string) => void
  addSource: (claimId: string, factId: string, source: Omit<SourceRecord, 'id' | 'capturedAt' | 'version'>, counter: boolean) => void
  /** 记者发起更正：选择旧来源、填写原因并关联新材料；确认前仅暂存，原来源继续生效 */
  requestSourceCorrection: (input: { claimId: string; factId: string; counter: boolean; oldSourceId: string; reason: string; requestedBy: string; newSource: Omit<SourceRecord, 'id' | 'capturedAt' | 'version'> }) => { ok: boolean; message: string }
  /** 编辑确认：旧来源标记留档，新材料进入事实来源列表，生成更正版本，发布档案不改写 */
  confirmSourceCorrection: (correctionId: string, reviewer: string, note: string) => { ok: boolean; message: string }
  /** 编辑驳回：新材料不生效，报告继续显示原来源 */
  rejectSourceCorrection: (correctionId: string, reviewer: string, note: string) => { ok: boolean; message: string }
  transitionClaim: (claimId: string, status: Claim['status'], note: string) => { ok: boolean; message: string }
  reset: () => void
}

let idSeed = 100
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${idSeed++}`

export const useClaimStore = create<ClaimState>()(persist((set, get) => ({
  claims: seedClaims,
  versions: seedVersions,
  audit: seedAudit,
  corrections: seedCorrections,
  publishedSnapshots: seedPublishedSnapshots,
  keyword: '',
  status: '全部',
  setKeyword: (keyword) => set({ keyword }),
  setStatus: (status) => set({ status }),
  addClaim: (input) => {
    const now = new Date().toISOString()
    const claim: Claim = { id: nextId('FC'), ...input, editor: '宋卓', status: '核查中', createdAt: now, updatedAt: now, version: 1, facts: [] }
    set((state) => ({ claims: [claim, ...state.claims], audit: [audit(claim.id, '建立核查主张', input.reporter, input.summary), ...state.audit] }))
    return claim
  },
  addFact: (claimId, text) => set((state) => {
    const claim = state.claims.find((item) => item.id === claimId)
    if (!claim || !text.trim()) return state
    claim.facts.push({ id: nextId('F'), text, conclusion: '证据不足', confidence: 30, unresolved: ['尚未关联来源'], sources: [], counterSources: [], annotations: [] })
    claim.version += 1
    claim.updatedAt = new Date().toISOString()
    return { claims: [...state.claims], audit: [audit(claimId, '拆分可验证事实', claim.reporter, text), ...state.audit] }
  }),
  updateFact: (claimId, factId, patch) => set((state) => {
    const claim = state.claims.find((item) => item.id === claimId)
    const fact = claim?.facts.find((item) => item.id === factId)
    if (!claim || !fact) return state
    if (patch.conclusion && patch.conclusion !== '证据不足' && fact.unresolved.length) {
      patch.confidence = Math.min(patch.confidence ?? fact.confidence, 75)
    }
    Object.assign(fact, patch)
    claim.version += 1
    claim.updatedAt = new Date().toISOString()
    return { claims: [...state.claims], audit: [audit(claimId, '更新事实结论', '当前用户', `${fact.text}：${fact.conclusion}`), ...state.audit] }
  }),
  addAnnotation: (claimId, factId, input) => set((state) => {
    const claim = state.claims.find((item) => item.id === claimId)
    const fact = claim?.facts.find((item) => item.id === factId)
    if (!claim || !fact) return state
    fact.annotations.unshift({ ...input, id: nextId('N'), createdAt: new Date().toISOString(), resolved: false })
    return { claims: [...state.claims], audit: [audit(claimId, '添加批注', input.author, input.content), ...state.audit] }
  }),
  resolveAnnotation: (claimId, factId, annotationId) => set((state) => {
    const claim = state.claims.find((item) => item.id === claimId)
    const annotation = claim?.facts.find((item) => item.id === factId)?.annotations.find((item) => item.id === annotationId)
    if (!claim || !annotation) return state
    annotation.resolved = true
    return { claims: [...state.claims], audit: [audit(claimId, '解决批注', '当前用户', annotation.content), ...state.audit] }
  }),
  addSource: (claimId, factId, input, counter) => set((state) => {
    const claim = state.claims.find((item) => item.id === claimId)
    const fact = claim?.facts.find((item) => item.id === factId)
    if (!claim || !fact) return state
    const list = counter ? fact.counterSources : fact.sources
    const sameTitle = list.filter((item) => item.title === input.title).length
    const source: SourceRecord = { ...input, id: nextId(counter ? 'C' : 'S'), capturedAt: new Date().toISOString(), version: sameTitle + 1 }
    list.unshift(source)
    claim.version += 1
    claim.updatedAt = new Date().toISOString()
    return { claims: [...state.claims], audit: [audit(claimId, counter ? '保留相反证据' : '关联来源', '当前用户', input.title), ...state.audit] }
  }),
  requestSourceCorrection: ({ claimId, factId, counter, oldSourceId, reason, requestedBy, newSource }) => {
    const state = get()
    const claim = state.claims.find((item) => item.id === claimId)
    const fact = claim?.facts.find((item) => item.id === factId)
    const list = fact ? (counter ? fact.counterSources : fact.sources) : []
    const old = list.find((item) => item.id === oldSourceId)
    if (!claim || !fact || !old) return { ok: false, message: '未找到要更正的来源' }
    if (old.supersededBy) return { ok: false, message: '该来源已被更正，请查看历史记录' }
    const busy = state.corrections.some((item) => item.claimId === claimId && item.factId === factId && item.oldSourceId === oldSourceId && item.status === '待编辑确认')
    if (busy) return { ok: false, message: '该来源已有待确认的更正申请' }
    if (!reason.trim()) return { ok: false, message: '请填写更正原因' }
    if (!newSource.title.trim() || !newSource.url.trim()) return { ok: false, message: '请完整关联新材料' }

    const now = new Date().toISOString()
    const staged: SourceRecord = { ...newSource, id: nextId('S'), capturedAt: now, version: old.version + 1, supersedes: old.id }
    const correction: SourceCorrection = {
      id: nextId('CR'), claimId, factId, counter, oldSourceId: old.id, reason: reason.trim(),
      requestedBy, requestedAt: now, newSource: staged, status: '待编辑确认'
    }
    // 仅登记申请与暂存材料，不改动事实来源列表；报告继续显示原来源
    claim.updatedAt = now
    set((current) => ({
      corrections: [correction, ...current.corrections],
      claims: [...current.claims],
      audit: [audit(claimId, '发起来源更正', requestedBy, `${correction.id}：申请更正 ${old.id}（${old.title}），待编辑确认前报告继续显示原来源`), ...current.audit]
    }))
    return { ok: true, message: '更正申请已提交，等待编辑确认' }
  },
  confirmSourceCorrection: (correctionId, reviewer, note) => {
    const state = get()
    const correction = state.corrections.find((item) => item.id === correctionId)
    if (!correction) return { ok: false, message: '更正申请不存在' }
    if (correction.status !== '待编辑确认') return { ok: false, message: '该更正申请已处理' }
    const claim = state.claims.find((item) => item.id === correction.claimId)
    const fact = claim?.facts.find((item) => item.id === correction.factId)
    const list = fact ? (correction.counter ? fact.counterSources : fact.sources) : []
    const old = list.find((item) => item.id === correction.oldSourceId)
    if (!claim || !fact || !old) return { ok: false, message: '原来源已不存在，无法确认' }
    if (list.some((item) => item.id === correction.newSource.id)) return { ok: false, message: '新材料已在来源列表中' }

    const now = new Date().toISOString()
    // 旧来源保留在历史中，仅标记被谁更正；新材料成为当前事实依据
    old.supersededBy = correction.newSource.id
    list.unshift(correction.newSource)
    claim.version += 1
    claim.updatedAt = now

    const version: VersionRecord = {
      id: nextId('V'), claimId: claim.id, version: claim.version, editor: reviewer,
      summary: `来源更正：${old.title} → ${correction.newSource.title}；旧来源留档，已发布档案不改写。`,
      changedFactIds: [fact.id], removedEvidence: [], createdAt: now,
      type: '来源更正', correctionId: correction.id, oldSourceId: old.id, newSourceId: correction.newSource.id
    }
    correction.status = '已确认'
    correction.reviewedBy = reviewer
    correction.reviewedAt = now
    correction.reviewNote = note.trim() || '编辑确认来源更正。'
    set((current) => ({
      claims: [...current.claims],
      corrections: [...current.corrections],
      versions: [version, ...current.versions],
      audit: [audit(claim.id, '确认来源更正', reviewer, `${correction.id}：确认 ${old.id} → ${correction.newSource.id}，生成更正版本 V${claim.version}，旧来源留档，发布档案不改写`), ...current.audit]
    }))
    return { ok: true, message: `已确认更正并生成 V${claim.version}` }
  },
  rejectSourceCorrection: (correctionId, reviewer, note) => {
    const state = get()
    const correction = state.corrections.find((item) => item.id === correctionId)
    if (!correction) return { ok: false, message: '更正申请不存在' }
    if (correction.status !== '待编辑确认') return { ok: false, message: '该更正申请已处理' }
    if (!note.trim()) return { ok: false, message: '请填写驳回理由' }
    const now = new Date().toISOString()
    correction.status = '已驳回'
    correction.reviewedBy = reviewer
    correction.reviewedAt = now
    correction.reviewNote = note.trim()
    const claim = state.claims.find((item) => item.id === correction.claimId)
    if (claim) claim.updatedAt = now
    set((current) => ({
      corrections: [...current.corrections],
      claims: [...current.claims],
      audit: [audit(correction.claimId, '驳回来源更正', reviewer, `${correction.id}：驳回对 ${correction.oldSourceId} 的更正，报告继续显示原来源。理由：${note.trim()}`), ...current.audit]
    }))
    return { ok: true, message: '已驳回，报告继续显示原来源' }
  },
  transitionClaim: (claimId, status, note) => {
    const state = get()
    const claim = state.claims.find((item) => item.id === claimId)
    if (!claim) return { ok: false, message: '主张不存在' }
    if (status === '待编辑复核' && claim.facts.length === 0) return { ok: false, message: '至少需要一项可验证事实' }
    if (status === '已发布') {
      if (claim.facts.some((fact) => fact.conclusion === '证据不足' && fact.unresolved.length)) return { ok: false, message: '仍有未解决疑点，不能发布' }
      if (!claim.editor) return { ok: false, message: '缺少编辑复核人' }
    }
    claim.status = status
    claim.version += 1
    claim.updatedAt = new Date().toISOString()
    const version: VersionRecord = { id: nextId('V'), claimId, version: claim.version, editor: claim.editor || '当前用户', summary: note, changedFactIds: [], removedEvidence: [], createdAt: claim.updatedAt, type: '状态流转' }
    // 首次发布冻结完整档案；重复流转（含发布后的来源更正）不改写既有发布快照
    let snapshots = state.publishedSnapshots
    if (status === '已发布' && !state.publishedSnapshots.some((item) => item.claimId === claimId)) {
      const snapshot: PublishedSnapshot = { claimId, version: claim.version, editor: claim.editor, publishedAt: claim.updatedAt, claim: structuredClone(claim) }
      snapshots = [snapshot, ...snapshots]
    }
    set((current) => ({ claims: [...current.claims], versions: [version, ...current.versions], publishedSnapshots: snapshots, audit: [audit(claimId, `状态流转：${status}`, '当前用户', note), ...current.audit] }))
    return { ok: true, message: `已流转至${status}` }
  },
  reset: () => set({ claims: structuredClone(seedClaims), versions: structuredClone(seedVersions), audit: structuredClone(seedAudit), corrections: structuredClone(seedCorrections), publishedSnapshots: structuredClone(seedPublishedSnapshots), keyword: '', status: '全部' })
}), { name: 'gsb68:fact-check-workbench' }))

function audit(claimId: string, action: string, operator: string, detail: string): AuditEntry {
  return { id: nextId('AUD'), claimId, action, operator, detail, createdAt: new Date().toISOString() }
}

export const conclusionColor: Record<FactConclusion, string> = {
  已证实: 'green',
  部分属实: 'yellow',
  证据不足: 'orange',
  不实: 'red'
}

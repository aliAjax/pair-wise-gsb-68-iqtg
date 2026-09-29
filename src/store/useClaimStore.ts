import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedAudit, seedClaims, seedCorrections, seedVersions } from '../data/seed'
import type { AuditEntry, Claim, ClaimAnnotation, ClaimFact, FactConclusion, SourceCorrection, SourceRecord, VersionRecord } from '../types'

interface CorrectionRequestInput {
  claimId: string
  factId: string
  oldSourceId: string
  counter: boolean
  reason: string
  newSource: Omit<SourceRecord, 'id' | 'capturedAt' | 'version' | 'supersededBy'>
}

interface ClaimState {
  claims: Claim[]
  versions: VersionRecord[]
  audit: AuditEntry[]
  corrections: SourceCorrection[]
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
  requestSourceCorrection: (input: CorrectionRequestInput) => { ok: boolean; message: string }
  confirmSourceCorrection: (correctionId: string, editor: string) => { ok: boolean; message: string }
  rejectSourceCorrection: (correctionId: string, editor: string, reason: string) => { ok: boolean; message: string }
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
  requestSourceCorrection: ({ claimId, factId, oldSourceId, counter, reason, newSource }) => {
    const claim = get().claims.find((item) => item.id === claimId)
    const fact = claim?.facts.find((item) => item.id === factId)
    if (!claim || !fact) return { ok: false, message: '主张或事实不存在' }
    if (claim.status === '已撤回') return { ok: false, message: '主张已撤回，不能申请来源更正' }
    if (!reason.trim()) return { ok: false, message: '请填写更正原因' }
    if (!newSource.title.trim() || !newSource.url.trim()) return { ok: false, message: '请补全新材料的标题和公开地址' }
    const list = counter ? fact.counterSources : fact.sources
    const old = list.find((item) => item.id === oldSourceId)
    if (!old) return { ok: false, message: '待更正的来源不存在或已被替代' }
    if (get().corrections.some((item) => item.factId === factId && item.oldSourceId === oldSourceId && item.status === '待编辑确认')) {
      return { ok: false, message: '该来源已有待确认的更正申请' }
    }
    const now = new Date().toISOString()
    const newSourceId = nextId(counter ? 'C' : 'S')
    const record: SourceCorrection = {
      id: nextId('CR'), claimId, factId, oldSourceId, counter, reason,
      newSourceId,
      newSource: { ...newSource, id: newSourceId, capturedAt: now, version: old.version + 1 },
      requestedBy: claim.reporter || '当前用户', requestedAt: now, status: '待编辑确认'
    }
    set((state) => ({
      corrections: [record, ...state.corrections],
      // 申请阶段：旧来源保持原位、当前事实不变，只追加审计
      audit: [audit(claimId, '申请来源更正', record.requestedBy, `${fact.text}：以「${newSource.title}」申请替换「${old.title}」，原因：${reason}`), ...state.audit]
    }))
    return { ok: true, message: '更正申请已提交，编辑确认前报告继续使用原来源' }
  },
  confirmSourceCorrection: (correctionId, editorName) => {
    const correction = get().corrections.find((item) => item.id === correctionId)
    if (!correction) return { ok: false, message: '更正申请不存在' }
    if (correction.status !== '待编辑确认') return { ok: false, message: '该申请已处理' }
    const claim = get().claims.find((item) => item.id === correction.claimId)
    const fact = claim?.facts.find((item) => item.id === correction.factId)
    if (!claim || !fact) return { ok: false, message: '主张或事实不存在' }
    const list = correction.counter ? fact.counterSources : fact.sources
    const oldIndex = list.findIndex((item) => item.id === correction.oldSourceId)
    if (oldIndex < 0) return { ok: false, message: '待更正的来源不存在' }
    const now = new Date().toISOString()
    const old = { ...list[oldIndex], supersededBy: correction.newSourceId }
    const fresh: SourceRecord = { ...correction.newSource, id: correction.newSourceId, capturedAt: correction.newSource.capturedAt, supersededBy: undefined }
    // 旧来源移入事实级历史（追加、不删除），新材料占据当前来源位置
    list.splice(oldIndex, 1, fresh)
    fact.sourceHistory = [...(fact.sourceHistory ?? []), old]
    correction.status = '已确认'
    correction.confirmedBy = editorName || claim.editor || '当前用户'
    correction.confirmedAt = now
    claim.version += 1
    claim.updatedAt = now
    const version: VersionRecord = {
      id: nextId('V'), claimId: claim.id, version: claim.version, editor: correction.confirmedBy,
      summary: `来源更正：「${old.title}」→「${fresh.title}」；${correction.reason}`,
      changedFactIds: [fact.id], removedEvidence: [], createdAt: now, kind: '来源更正', sourceCorrectionId: correction.id
    }
    set((state) => ({
      claims: [...state.claims], corrections: [...state.corrections],
      versions: [version, ...state.versions],
      audit: [audit(claim.id, '确认来源更正', correction.confirmedBy!, `${correction.id}：旧来源 ${old.id} 留存历史，新材料 ${fresh.id} 启用，生成 V${claim.version}`), ...state.audit]
    }))
    return { ok: true, message: `已确认并生成更正版本 V${claim.version}，旧来源保留在历史中` }
  },
  rejectSourceCorrection: (correctionId, editorName, reason) => {
    const correction = get().corrections.find((item) => item.id === correctionId)
    if (!correction) return { ok: false, message: '更正申请不存在' }
    if (correction.status !== '待编辑确认') return { ok: false, message: '该申请已处理' }
    if (!reason.trim()) return { ok: false, message: '请填写驳回理由' }
    const now = new Date().toISOString()
    correction.status = '已驳回'
    correction.rejectedBy = editorName || '当前用户'
    correction.rejectedAt = now
    correction.rejectReason = reason
    set((state) => ({
      corrections: [...state.corrections],
      audit: [audit(correction.claimId, '驳回来源更正', correction.rejectedBy!, `${correction.id}：${reason}`), ...state.audit]
    }))
    return { ok: true, message: '已驳回，报告继续使用原来源' }
  },
  transitionClaim: (claimId, status, note) => {
    const state = get()
    const claim = state.claims.find((item) => item.id === claimId)
    if (!claim) return { ok: false, message: '主张不存在' }
    if (status === '待编辑复核' && claim.facts.length === 0) return { ok: false, message: '至少需要一项可验证事实' }
    if (status === '已发布') {
      if (claim.facts.some((fact) => fact.conclusion === '证据不足' && fact.unresolved.length)) return { ok: false, message: '仍有未解决疑点，不能发布' }
      if (!claim.editor) return { ok: false, message: '缺少编辑复核人' }
      if (state.corrections.some((item) => item.claimId === claimId && item.status === '待编辑确认')) return { ok: false, message: '存在待确认的来源更正申请，请先处理' }
    }
    claim.status = status
    claim.version += 1
    claim.updatedAt = new Date().toISOString()
    // 发布时冻结报告快照；之后的来源更正只产生新版本，不改写快照
    const publishedSnapshot = status === '已发布' ? structuredClone(claim) : undefined
    const version: VersionRecord = { id: nextId('V'), claimId, version: claim.version, editor: claim.editor || '当前用户', summary: note, changedFactIds: [], removedEvidence: [], createdAt: claim.updatedAt, kind: '状态流转', publishedSnapshot }
    set((current) => ({ claims: [...current.claims], versions: [version, ...current.versions], audit: [audit(claimId, `状态流转：${status}`, '当前用户', note), ...current.audit] }))
    return { ok: true, message: `已流转至${status}` }
  },
  reset: () => set({ claims: structuredClone(seedClaims), versions: structuredClone(seedVersions), audit: structuredClone(seedAudit), corrections: structuredClone(seedCorrections), keyword: '', status: '全部' })
}), {
  name: 'gsb68:fact-check-workbench',
  version: 2,
  merge: (persisted, current) => {
    const saved = (persisted ?? {}) as Partial<ClaimState>
    return {
      ...current,
      ...saved,
      // 旧版本本地缓存缺少更正表时回落到种子数据
      corrections: saved.corrections ?? current.corrections
    }
  }
}))

function audit(claimId: string, action: string, operator: string, detail: string): AuditEntry {
  return { id: nextId('AUD'), claimId, action, operator, detail, createdAt: new Date().toISOString() }
}

export const conclusionColor: Record<FactConclusion, string> = {
  已证实: 'green',
  部分属实: 'yellow',
  证据不足: 'orange',
  不实: 'red'
}

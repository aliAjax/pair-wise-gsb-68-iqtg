export type ClaimStatus = '核查中' | '待编辑复核' | '已发布' | '已撤回'
export type FactConclusion = '已证实' | '部分属实' | '证据不足' | '不实'
export type EvidenceKind = '原始证据' | '二次来源' | '待证信息'
export type CorrectionStatus = '待编辑确认' | '已确认' | '已驳回'

export interface SourceRecord {
  id: string
  title: string
  url: string
  publisher: string
  publishedAt: string
  capturedAt: string
  kind: EvidenceKind
  chainOfCustody: string
  contentHash: string
  version: number
  supersededBy?: string
}

export interface ClaimAnnotation {
  id: string
  author: string
  role: '记者' | '编辑' | '事实核查员'
  content: string
  createdAt: string
  resolved: boolean
}

export interface ClaimFact {
  id: string
  text: string
  conclusion: FactConclusion
  confidence: number
  unresolved: string[]
  sources: SourceRecord[]
  counterSources: SourceRecord[]
  annotations: ClaimAnnotation[]
  /** 已被更正替代的旧来源，只追加、不删除 */
  sourceHistory?: SourceRecord[]
}

/** 来源更正申请：编辑确认前不改变当前事实所引用的来源 */
export interface SourceCorrection {
  id: string
  claimId: string
  factId: string
  oldSourceId: string
  newSourceId: string
  counter: boolean
  /** 记者填写的更正原因 */
  reason: string
  /** 关联的新材料，确认后才写入当前来源列表 */
  newSource: SourceRecord
  requestedBy: string
  requestedAt: string
  status: CorrectionStatus
  confirmedBy?: string
  confirmedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectReason?: string
}

export interface Claim {
  id: string
  title: string
  summary: string
  reporter: string
  editor: string
  status: ClaimStatus
  priority: '低' | '中' | '高'
  createdAt: string
  updatedAt: string
  version: number
  facts: ClaimFact[]
}

export interface VersionRecord {
  id: string
  claimId: string
  version: number
  editor: string
  summary: string
  changedFactIds: string[]
  removedEvidence: string[]
  createdAt: string
  kind?: '状态流转' | '来源更正'
  sourceCorrectionId?: string
  /** 发布时冻结的报告快照，后续来源更正不改写它 */
  publishedSnapshot?: Claim
}

export interface AuditEntry {
  id: string
  claimId: string
  action: string
  operator: string
  detail: string
  createdAt: string
}

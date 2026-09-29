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
  /** 已被哪条新材料更正（留档历史，不删除不覆盖） */
  supersededBy?: string
  /** 本材料更正了哪条旧来源 */
  supersedes?: string
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
  /** 来源更正生成的版本会记录更正申请与新旧两条来源 */
  type?: '状态流转' | '来源更正'
  correctionId?: string
  oldSourceId?: string
  newSourceId?: string
}

export interface AuditEntry {
  id: string
  claimId: string
  action: string
  operator: string
  detail: string
  createdAt: string
}

/**
 * 来源更正申请：记者发起后进入“待编辑确认”，期间原来源继续生效；
 * 编辑确认后旧来源标记 supersededBy 留在历史，新材料成为当前依据。
 */
export interface SourceCorrection {
  id: string
  claimId: string
  factId: string
  counter: boolean
  oldSourceId: string
  reason: string
  requestedBy: string
  requestedAt: string
  /** 记者关联的新材料，确认前仅暂存，不进入事实来源列表 */
  newSource: SourceRecord
  status: CorrectionStatus
  reviewedBy?: string
  reviewedAt?: string
  reviewNote?: string
}

/** 发布时刻冻结的完整主张快照，后续更正只追加版本，不改写本档案 */
export interface PublishedSnapshot {
  claimId: string
  version: number
  editor: string
  publishedAt: string
  claim: Claim
}

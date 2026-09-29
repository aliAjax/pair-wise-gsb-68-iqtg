import type { AuditEntry, Claim, SourceCorrection, VersionRecord } from '../types'

export const seedClaims: Claim[] = [
  {
    id: 'FC-260929-01', title: '某地新建数据中心停用全部柴油应急电源', summary: '社交平台流传项目验收文件截图，称数据中心取消柴油发电机改为纯储能供电。',
    reporter: '沈言', editor: '宋卓', status: '待编辑复核', priority: '高', createdAt: '2026-09-29T08:10:00', updatedAt: '2026-09-29T15:30:00', version: 4,
    facts: [
      {
        id: 'F-1', text: '项目规划文件中曾包含2台柴油发电机组。', conclusion: '已证实', confidence: 98, unresolved: [],
        sources: [
          { id: 'S-1', title: '一期工程环境影响报告表', url: 'https://example.gov.cn/report/2025-1102', publisher: '市生态环境局', publishedAt: '2025-11-02', capturedAt: '2026-09-29T08:40:00', kind: '原始证据', chainOfCustody: '官网下载PDF，哈希时间戳已记录', contentHash: 'sha256:9d31f1...a42c', version: 1 },
          { id: 'S-2', title: '项目设备采购公告', url: 'https://example.com/tender/8821', publisher: '公共资源交易平台', publishedAt: '2026-01-18', capturedAt: '2026-09-29T08:52:00', kind: '原始证据', chainOfCustody: '官网页面快照与原始附件同时留存', contentHash: 'sha256:7bc029...de10', version: 2 }
        ], counterSources: [], annotations: [{ id: 'N-1', author: '宋卓', role: '编辑', content: '请补充规划变更批复，不能用采购公告单独代表最终方案。', createdAt: '2026-09-29T10:20:00', resolved: false }]
      },
      {
        id: 'F-2', text: '最终验收已取消柴油应急电源。', conclusion: '证据不足', confidence: 42, unresolved: ['缺少竣工验收备案原件', '网传截图无文件编号与签章页'],
        sources: [{ id: 'S-3', title: '匿名用户上传的验收文件局部截图', url: 'https://social.example/post/9901', publisher: '社交平台账号', publishedAt: '2026-09-28', capturedAt: '2026-09-29T09:05:00', kind: '待证信息', chainOfCustody: '已保存原帖与图片EXIF，待向主管部门核验', contentHash: 'sha256:1fe210...67bd', version: 1 }],
        counterSources: [{ id: 'C-1', title: '储能系统招标文件仍列出柴发切换接口', url: 'https://example.com/tender/9102', publisher: '公共资源交易平台', publishedAt: '2026-03-04', capturedAt: '2026-09-29T14:10:00', kind: '原始证据', chainOfCustody: '附件原文留存，相关条款见第42页', contentHash: 'sha256:c7249a...001f', version: 1 }],
        annotations: [{ id: 'N-2', author: '陆衡', role: '事实核查员', content: '该结论不得以匿名截图单独成立，需取得主管部门书面确认。', createdAt: '2026-09-29T14:25:00', resolved: false }]
      },
      {
        id: 'F-3', text: '纯储能方案足以覆盖消防和一级负荷供电。', conclusion: '证据不足', confidence: 31, unresolved: ['缺少负荷计算书', '缺少消防验收文件'],
        sources: [{ id: 'S-4', title: '设备厂商技术白皮书', url: 'https://vendor.example/white-paper', publisher: '设备厂商', publishedAt: '2026-05-12', capturedAt: '2026-09-29T11:10:00', kind: '二次来源', chainOfCustody: '厂商官网PDF留存', contentHash: 'sha256:6a8d22...41ee', version: 1 }],
        counterSources: [], annotations: []
      }
    ]
  },
  {
    id: 'FC-260928-03', title: '城区供水异味来自河道藻类暴发', summary: '居民投诉自来水异味，网络传言指向上游工业排放，需核查水质报告与采样链。',
    reporter: '顾薇', editor: '宋卓', status: '核查中', priority: '中', createdAt: '2026-09-28T09:00:00', updatedAt: '2026-09-29T13:10:00', version: 2,
    facts: [
      { id: 'F-4', text: '多个采样点的2-甲基异莰醇检测值超过嗅阈值。', conclusion: '已证实', confidence: 93, unresolved: [], sources: [{ id: 'S-5', title: '市供水水质周报', url: 'https://example.gov.cn/water/0928', publisher: '市水务局', publishedAt: '2026-09-28', capturedAt: '2026-09-28T16:20:00', kind: '原始证据', chainOfCustody: '官网数据与PDF报告留存', contentHash: 'sha256:228a2...09cf', version: 1 }], counterSources: [], annotations: [] },
      { id: 'F-5', text: '异味由上游企业偷排直接造成。', conclusion: '不实', confidence: 88, unresolved: [], sources: [], counterSources: [{ id: 'C-2', title: '上游排口在线监测与执法巡查记录', url: 'https://example.gov.cn/env/0929', publisher: '市生态环境局', publishedAt: '2026-09-29', capturedAt: '2026-09-29T12:00:00', kind: '原始证据', chainOfCustody: '官方接口导出CSV，记录数据签名', contentHash: 'sha256:ab45d...9c31', version: 1 }], annotations: [] }
    ]
  },
  {
    // 已发布后拿到更正材料：F-6 的旧来源已被确认替代（V3 发布 → V4 更正）；F-7 有一笔待确认申请
    id: 'FC-260927-02', title: '跨海大桥主桥结构设计使用年限为100年', summary: '短视频称桥梁设计寿命仅50年、提前老化，需依据设计文件与检测报告核查。',
    reporter: '沈言', editor: '宋卓', status: '已发布', priority: '中', createdAt: '2026-09-26T10:00:00', updatedAt: '2026-09-28T10:05:00', version: 4,
    facts: [
      {
        id: 'F-6', text: '主桥结构设计文件载明的设计使用年限为100年。', conclusion: '已证实', confidence: 96, unresolved: [],
        sources: [
          { id: 'S-8', title: '省交通运输厅政府信息公开答复（跨海桥〔2026〕41号）', url: 'https://jt.example.gov.cn/open/2026-41', publisher: '省交通运输厅', publishedAt: '2026-09-25', capturedAt: '2026-09-28T09:30:00', kind: '原始证据', chainOfCustody: '政府信息公开平台下载带电子签章PDF，原件归档', contentHash: 'sha256:51be77...88d2', version: 2 }
        ],
        counterSources: [], annotations: [],
        sourceHistory: [
          { id: 'S-7', title: '桥梁设计说明（媒体资料页转载版）', url: 'https://media.example.com/bridge-design-note', publisher: '某新闻网资料页', publishedAt: '2026-09-20', capturedAt: '2026-09-26T11:20:00', kind: '二次来源', chainOfCustody: '网页快照留存，转载页未附设计单位签章', contentHash: 'sha256:0c9f14...77aa', version: 1, supersededBy: 'S-8' }
        ]
      },
      {
        id: 'F-7', text: '最近一次定期检测未发现影响结构安全的病害。', conclusion: '已证实', confidence: 90, unresolved: [],
        sources: [
          { id: 'S-9', title: '2026年上半年桥梁定期检测情况通报', url: 'https://jt.example.gov.cn/inspect/2026h1', publisher: '省交通运输厅', publishedAt: '2026-07-30', capturedAt: '2026-09-26T15:00:00', kind: '原始证据', chainOfCustody: '官网通报PDF与下载页快照同时留存', contentHash: 'sha256:4a90d3...1f0b', version: 1 }
        ],
        counterSources: [], annotations: []
      }
    ]
  }
]

/** V3 发布时冻结的报告快照：F-6 仍引用转载版资料页，且没有更正历史 */
function publishedV3Snapshot(): Claim {
  return {
    id: 'FC-260927-02', title: '跨海大桥主桥结构设计使用年限为100年', summary: '短视频称桥梁设计寿命仅50年、提前老化，需依据设计文件与检测报告核查。',
    reporter: '沈言', editor: '宋卓', status: '已发布', priority: '中', createdAt: '2026-09-26T10:00:00', updatedAt: '2026-09-27T18:00:00', version: 3,
    facts: [
      {
        id: 'F-6', text: '主桥结构设计文件载明的设计使用年限为100年。', conclusion: '已证实', confidence: 96, unresolved: [],
        sources: [
          { id: 'S-7', title: '桥梁设计说明（媒体资料页转载版）', url: 'https://media.example.com/bridge-design-note', publisher: '某新闻网资料页', publishedAt: '2026-09-20', capturedAt: '2026-09-26T11:20:00', kind: '二次来源', chainOfCustody: '网页快照留存，转载页未附设计单位签章', contentHash: 'sha256:0c9f14...77aa', version: 1 }
        ],
        counterSources: [], annotations: []
      },
      {
        id: 'F-7', text: '最近一次定期检测未发现影响结构安全的病害。', conclusion: '已证实', confidence: 90, unresolved: [],
        sources: [
          { id: 'S-9', title: '2026年上半年桥梁定期检测情况通报', url: 'https://jt.example.gov.cn/inspect/2026h1', publisher: '省交通运输厅', publishedAt: '2026-07-30', capturedAt: '2026-09-26T15:00:00', kind: '原始证据', chainOfCustody: '官网通报PDF与下载页快照同时留存', contentHash: 'sha256:4a90d3...1f0b', version: 1 }
        ],
        counterSources: [], annotations: []
      }
    ]
  }
}

export const seedCorrections: SourceCorrection[] = [
  {
    id: 'CR-2', claimId: 'FC-260927-02', factId: 'F-7', oldSourceId: 'S-9', newSourceId: 'S-11', counter: false,
    reason: '检测机构补充提供了加盖CMA章的完整检测报告原件，官网通报仅为摘要且缺少病害评定附表。',
    newSource: {
      id: 'S-11', title: '跨海大桥2026年定期检测报告（CMA签章原件）', url: 'https://files.example.gov.cn/bridge/2026-inspection-full.pdf', publisher: '省交通工程质量监督站', publishedAt: '2026-09-28', capturedAt: '2026-09-29T09:35:00', kind: '原始证据', chainOfCustody: '记者通过主管部门邮件取得签章PDF，原件与邮件头一并归档', contentHash: 'sha256:8d30aa...6c1e', version: 2
    },
    requestedBy: '沈言', requestedAt: '2026-09-29T09:40:00', status: '待编辑确认'
  },
  {
    id: 'CR-1', claimId: 'FC-260927-02', factId: 'F-6', oldSourceId: 'S-7', newSourceId: 'S-8', counter: false,
    reason: '发布后收到读者线索：转载资料页内容不完整。向省厅申请政府信息公开，取得带电子签章的正式答复，明确设计使用年限100年。',
    newSource: {
      id: 'S-8', title: '省交通运输厅政府信息公开答复（跨海桥〔2026〕41号）', url: 'https://jt.example.gov.cn/open/2026-41', publisher: '省交通运输厅', publishedAt: '2026-09-25', capturedAt: '2026-09-28T09:30:00', kind: '原始证据', chainOfCustody: '政府信息公开平台下载带电子签章PDF，原件归档', contentHash: 'sha256:51be77...88d2', version: 2
    },
    requestedBy: '沈言', requestedAt: '2026-09-28T09:20:00', status: '已确认', confirmedBy: '宋卓', confirmedAt: '2026-09-28T10:05:00'
  }
]

export const seedVersions: VersionRecord[] = [
  { id: 'V-1', claimId: 'FC-260929-01', version: 4, editor: '沈言', summary: '补充储能系统招标文件和相反证据，降低第二、第三项事实置信度。', changedFactIds: ['F-2', 'F-3'], removedEvidence: ['匿名聊天记录截图'], createdAt: '2026-09-29T15:30:00' },
  { id: 'V-2', claimId: 'FC-260929-01', version: 3, editor: '陆衡', summary: '补充匿名截图保管链和未解决疑点。', changedFactIds: ['F-2'], removedEvidence: [], createdAt: '2026-09-29T14:25:00' },
  { id: 'V-4', claimId: 'FC-260927-02', version: 4, editor: '宋卓', summary: '来源更正：「桥梁设计说明（媒体资料页转载版）」→「省交通运输厅政府信息公开答复（跨海桥〔2026〕41号）」；发布后收到读者线索，取得带电子签章的正式答复。', changedFactIds: ['F-6'], removedEvidence: [], createdAt: '2026-09-28T10:05:00', kind: '来源更正', sourceCorrectionId: 'CR-1' },
  { id: 'V-3', claimId: 'FC-260927-02', version: 3, editor: '宋卓', summary: '编辑复核通过，发布正式版本。', changedFactIds: [], removedEvidence: [], createdAt: '2026-09-27T18:00:00', kind: '状态流转', publishedSnapshot: publishedV3Snapshot() }
]

export const seedAudit: AuditEntry[] = [
  { id: 'A-1', claimId: 'FC-260929-01', action: '建立核查主张', operator: '沈言', detail: '创建3项可验证事实', createdAt: '2026-09-29T08:10:00' },
  { id: 'A-2', claimId: 'FC-260929-01', action: '关联原始证据', operator: '沈言', detail: '关联环评报告和设备采购公告', createdAt: '2026-09-29T08:55:00' },
  { id: 'A-3', claimId: 'FC-260929-01', action: '添加相反证据', operator: '陆衡', detail: '储能招标附件与纯储能结论冲突，保留争议', createdAt: '2026-09-29T14:10:00' },
  { id: 'A-4', claimId: 'FC-260927-02', action: '状态流转：已发布', operator: '宋卓', detail: '编辑复核通过，发布正式版本（V3，含发布快照）', createdAt: '2026-09-27T18:00:00' },
  { id: 'A-5', claimId: 'FC-260927-02', action: '申请来源更正', operator: '沈言', detail: '以「省交通运输厅政府信息公开答复」申请替换「桥梁设计说明（媒体资料页转载版）」', createdAt: '2026-09-28T09:20:00' },
  { id: 'A-6', claimId: 'FC-260927-02', action: '确认来源更正', operator: '宋卓', detail: 'CR-1：旧来源 S-7 留存历史，新材料 S-8 启用，生成 V4', createdAt: '2026-09-28T10:05:00' },
  { id: 'A-7', claimId: 'FC-260927-02', action: '申请来源更正', operator: '沈言', detail: '以「2026年定期检测报告（CMA签章原件）」申请替换「2026年上半年桥梁定期检测情况通报」', createdAt: '2026-09-29T09:40:00' }
]

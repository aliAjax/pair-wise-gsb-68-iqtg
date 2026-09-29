import type { AuditEntry, Claim, PublishedSnapshot, SourceCorrection, VersionRecord } from '../types'

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
    id: 'FC-260927-02', title: '城北快速路匝道提前两月通车', summary: '市交通局新闻通稿称匝道提前通车，记者复查时发现通稿引用的竣工文件编号已被主管部门撤换。',
    reporter: '顾薇', editor: '宋卓', status: '已发布', priority: '中', createdAt: '2026-09-25T09:30:00', updatedAt: '2026-09-29T10:05:00', version: 7,
    facts: [
      {
        id: 'F-6', text: 'A匝道已按变更后的竣工文件完成验收并提前通车。', conclusion: '已证实', confidence: 94, unresolved: [],
        sources: [
          { id: 'S-20', title: '市交通局重新发布的竣工备案说明（正式文号）', url: 'https://example.gov.cn/jt/2026/filing-revised', publisher: '市交通局', publishedAt: '2026-09-28', capturedAt: '2026-09-28T17:40:00', kind: '原始证据', chainOfCustody: '政府信息公开栏目下载修订版PDF，含正式文号与签章页', contentHash: 'sha256:51f8ce...77a2', version: 2, supersedes: 'S-6' },
          { id: 'S-6', title: '市交通局9月25日新闻通稿附件（竣工备案）', url: 'https://example.gov.cn/jt/2026/filing-old', publisher: '市交通局', publishedAt: '2026-09-25', capturedAt: '2026-09-25T16:00:00', kind: '原始证据', chainOfCustody: '官网PDF留档；该附件后被撤下，旧文件编号作废', contentHash: 'sha256:0c92b4...1e7d', version: 1, supersededBy: 'S-20' }
        ],
        counterSources: [], annotations: []
      },
      {
        id: 'F-7', text: '通车时间比合同工期提前两个月。', conclusion: '部分属实', confidence: 76, unresolved: [],
        sources: [{ id: 'S-7', title: '施工合同与工期变更补充协议', url: 'https://example.com/contract/5530', publisher: '市公共资源交易中心', publishedAt: '2026-09-20', capturedAt: '2026-09-26T11:20:00', kind: '原始证据', chainOfCustody: '合同备案页与补充协议扫描件同时留存', contentHash: 'sha256:3e07d1...aa90', version: 1 }],
        counterSources: [], annotations: []
      }
    ]
  }
]

export const seedCorrections: SourceCorrection[] = [
  {
    id: 'CR-1', claimId: 'FC-260927-02', factId: 'F-6', counter: false, oldSourceId: 'S-6',
    reason: '市交通局撤下9月25日通稿附件，重新发布的备案说明使用了正式文号并补全签章页；旧附件中的文件编号已被主管部门确认作废，不能继续作为已发布报告的当前依据。',
    requestedBy: '顾薇', requestedAt: '2026-09-28T18:05:00',
    newSource: { id: 'S-20', title: '市交通局重新发布的竣工备案说明（正式文号）', url: 'https://example.gov.cn/jt/2026/filing-revised', publisher: '市交通局', publishedAt: '2026-09-28', capturedAt: '2026-09-28T17:40:00', kind: '原始证据', chainOfCustody: '政府信息公开栏目下载修订版PDF，含正式文号与签章页', contentHash: 'sha256:51f8ce...77a2', version: 2, supersedes: 'S-6' },
    status: '已确认', reviewedBy: '宋卓', reviewedAt: '2026-09-29T10:05:00', reviewNote: '已核对修订版文号与签章页，旧附件留档可查，确认以新材料作为当前事实依据并追加更正版本。'
  },
  {
    id: 'CR-2', claimId: 'FC-260929-01', factId: 'F-1', counter: false, oldSourceId: 'S-2',
    reason: '编辑批注指出不能用采购公告单独代表最终方案；记者从规划部门取得规划变更批复原件，可以更正该项事实的支撑来源。',
    requestedBy: '沈言', requestedAt: '2026-09-29T16:10:00',
    newSource: { id: 'S-21', title: '规划部门关于数据中心供电方案变更的批复（原件扫描）', url: 'https://example.gov.cn/ghj/2026/approval-7731', publisher: '市规划和自然资源局', publishedAt: '2026-09-29', capturedAt: '2026-09-29T16:00:00', kind: '原始证据', chainOfCustody: '政务窗口领取原件并扫描，与EMS封套编号一并留档', contentHash: 'sha256:88a031...c4f6', version: 3 },
    status: '待编辑确认'
  }
]

/** FC-260927-02 首次发布（V5）时刻冻结的完整档案：后来的来源更正（V7）不会改写它 */
export const seedPublishedSnapshots: PublishedSnapshot[] = [
  {
    claimId: 'FC-260927-02', version: 5, editor: '宋卓', publishedAt: '2026-09-27T09:00:00',
    claim: {
      id: 'FC-260927-02', title: '城北快速路匝道提前两月通车', summary: '市交通局新闻通稿称匝道提前通车，记者复查时发现通稿引用的竣工文件编号已被主管部门撤换。',
      reporter: '顾薇', editor: '宋卓', status: '已发布', priority: '中', createdAt: '2026-09-25T09:30:00', updatedAt: '2026-09-27T09:00:00', version: 5,
      facts: [
        {
          id: 'F-6', text: 'A匝道已按变更后的竣工文件完成验收并提前通车。', conclusion: '已证实', confidence: 90, unresolved: [],
          sources: [
            { id: 'S-6', title: '市交通局9月25日新闻通稿附件（竣工备案）', url: 'https://example.gov.cn/jt/2026/filing-old', publisher: '市交通局', publishedAt: '2026-09-25', capturedAt: '2026-09-25T16:00:00', kind: '原始证据', chainOfCustody: '官网PDF留档；该附件后被撤下，旧文件编号作废', contentHash: 'sha256:0c92b4...1e7d', version: 1 }
          ],
          counterSources: [], annotations: []
        },
        {
          id: 'F-7', text: '通车时间比合同工期提前两个月。', conclusion: '部分属实', confidence: 76, unresolved: [],
          sources: [{ id: 'S-7', title: '施工合同与工期变更补充协议', url: 'https://example.com/contract/5530', publisher: '市公共资源交易中心', publishedAt: '2026-09-20', capturedAt: '2026-09-26T11:20:00', kind: '原始证据', chainOfCustody: '合同备案页与补充协议扫描件同时留存', contentHash: 'sha256:3e07d1...aa90', version: 1 }],
          counterSources: [], annotations: []
        }
      ]
    }
  }
]

export const seedVersions: VersionRecord[] = [
  { id: 'V-1', claimId: 'FC-260929-01', version: 4, editor: '沈言', summary: '补充储能系统招标文件和相反证据，降低第二、第三项事实置信度。', changedFactIds: ['F-2', 'F-3'], removedEvidence: ['匿名聊天记录截图'], createdAt: '2026-09-29T15:30:00' },
  { id: 'V-2', claimId: 'FC-260929-01', version: 3, editor: '陆衡', summary: '补充匿名截图保管链和未解决疑点。', changedFactIds: ['F-2'], removedEvidence: [], createdAt: '2026-09-29T14:25:00' },
  { id: 'V-3', claimId: 'FC-260927-02', version: 5, type: '状态流转', editor: '宋卓', summary: '复核通过，发布正式版本并冻结发布档案。', changedFactIds: ['F-6', 'F-7'], removedEvidence: [], createdAt: '2026-09-27T09:00:00' },
  { id: 'V-4', claimId: 'FC-260927-02', version: 7, type: '来源更正', correctionId: 'CR-1', oldSourceId: 'S-6', newSourceId: 'S-20', editor: '宋卓', summary: '来源更正：以重新发布的竣工备案说明替换已撤下的通稿附件，旧来源留档，已发布档案不改写。', changedFactIds: ['F-6'], removedEvidence: [], createdAt: '2026-09-29T10:05:00' }
]

export const seedAudit: AuditEntry[] = [
  { id: 'A-1', claimId: 'FC-260929-01', action: '建立核查主张', operator: '沈言', detail: '创建3项可验证事实', createdAt: '2026-09-29T08:10:00' },
  { id: 'A-2', claimId: 'FC-260929-01', action: '关联原始证据', operator: '沈言', detail: '关联环评报告和设备采购公告', createdAt: '2026-09-29T08:55:00' },
  { id: 'A-3', claimId: 'FC-260929-01', action: '添加相反证据', operator: '陆衡', detail: '储能招标附件与纯储能结论冲突，保留争议', createdAt: '2026-09-29T14:10:00' },
  { id: 'A-4', claimId: 'FC-260927-02', action: '状态流转：已发布', operator: '宋卓', detail: '复核通过，发布正式版本（V5）并冻结发布档案', createdAt: '2026-09-27T09:00:00' },
  { id: 'A-5', claimId: 'FC-260927-02', action: '发起来源更正', operator: '顾薇', detail: 'CR-1：申请更正 S-6（通稿附件），原因：旧附件文件编号作废，已取得正式文号的修订版备案说明', createdAt: '2026-09-28T18:05:00' },
  { id: 'A-6', claimId: 'FC-260927-02', action: '确认来源更正', operator: '宋卓', detail: 'CR-1：确认 S-6 → S-20，生成更正版本 V7，旧来源留档，发布档案保持 V5 不改写', createdAt: '2026-09-29T10:05:00' },
  { id: 'A-7', claimId: 'FC-260929-01', action: '发起来源更正', operator: '沈言', detail: 'CR-2：申请更正 S-2（设备采购公告），新材料为规划变更批复原件，待编辑确认前报告继续显示原来源', createdAt: '2026-09-29T16:10:00' }
]

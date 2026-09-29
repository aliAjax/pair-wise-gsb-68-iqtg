import { useState } from 'react'
import { Badge, Box, Button, Collapse, Flex, Input, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react'
import { SourceDiffTable } from '../components/SourceDiffTable'
import { findSourceInClaim } from '../utils/source'
import { useClaimStore } from '../store/useClaimStore'
import type { SourceCorrection } from '../types'

export function AuditArchive() {
  const state = useClaimStore()
  const [keyword, setKeyword] = useState('')
  const rows = state.audit.filter((item) => `${item.claimId} ${item.action} ${item.operator} ${item.detail}`.toLowerCase().includes(keyword.toLowerCase()))
  const exportAll = () => {
    const payload = { generatedAt: new Date().toISOString(), claims: state.claims, versions: state.versions, corrections: state.corrections, publishedSnapshots: state.publishedSnapshots, audit: state.audit }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = '事实核查档案与审计.json'; anchor.click(); URL.revokeObjectURL(url)
  }
  return <Box p="6" pb="16">
    <Flex justify="space-between" align="center" mb="5"><Box><Text fontSize="xs" color="gray.600">主张 / 来源更正 / 批注 / 发布版本 / 不可变发布档案</Text><Text fontSize="xl" fontWeight="700" mt="1">核查档案与审计</Text></Box><Button colorScheme="teal" onClick={exportAll}>导出全部档案</Button></Flex>

    <Box mb="5">
      <Flex align="center" gap="2" mb="3"><Text fontWeight="700">来源更正记录</Text><Badge colorScheme="purple">{state.corrections.length}</Badge></Flex>
      <Flex direction="column" gap="3">{state.corrections.map((correction) => <CorrectionRecordCard key={correction.id} correction={correction} />)}</Flex>
    </Box>

    <Flex gap="3" mb="3"><Input maxW="460px" placeholder="搜索主张、动作、操作人或说明" value={keyword} onChange={(event) => setKeyword(event.target.value)} /><Text alignSelf="center" fontSize="xs" color="gray.500">共{rows.length}条不可变审计事件</Text></Flex>
    <Box bg="white" borderWidth="1px"><Table size="sm"><Thead><Tr><Th>时间</Th><Th>主张</Th><Th>动作</Th><Th>操作人</Th><Th>说明</Th></Tr></Thead><Tbody>{rows.map((item) => <Tr key={item.id}><Td fontSize="xs">{item.createdAt.replace('T', ' ').slice(0, 16)}</Td><Td fontFamily="mono" fontSize="xs">{item.claimId}</Td><Td><Badge colorScheme={item.action.includes('相反') ? 'red' : item.action.includes('发布') ? 'green' : item.action.includes('更正') ? 'purple' : 'blue'}>{item.action}</Badge></Td><Td>{item.operator}</Td><Td fontSize="sm">{item.detail}</Td></Tr>)}</Tbody></Table></Box>
    <Box mt="5" bg="white" borderWidth="1px" p="4"><Text fontWeight="700">版本差异原则</Text><Text fontSize="sm" color="gray.600" mt="2">被替换证据仍保留在版本记录中；发布版本不能隐藏相反证据、删除原始来源或覆盖既有批注。来源更正须经编辑确认：确认前报告继续显示原来源并标注待更正；确认后旧来源留档、新材料生效并生成更正版本，已发布档案不改写，两次来源差异与确认人均可追溯。</Text></Box>
  </Box>
}

function CorrectionRecordCard({ correction }: { correction: SourceCorrection }) {
  const state = useClaimStore()
  const [open, setOpen] = useState(false)
  const claim = state.claims.find((item) => item.id === correction.claimId)
  const oldSource = claim ? findSourceInClaim(claim, correction.oldSourceId) : undefined
  return <Box bg="white" borderWidth="1px" borderColor={correction.status === '已确认' ? 'purple.200' : correction.status === '已驳回' ? 'red.200' : 'orange.200'} p="4">
    <Flex justify="space-between" align="flex-start"><Box><Text fontFamily="mono" fontSize="xs" color="gray.500">{correction.id} · {correction.claimId} · 事实 {correction.factId}</Text><Text fontWeight="700" mt="1" fontSize="sm">{oldSource?.title ?? correction.oldSourceId} → {correction.newSource.title}</Text></Box><Badge colorScheme={correction.status === '已确认' ? 'purple' : correction.status === '已驳回' ? 'red' : 'orange'}>{correction.status}</Badge></Flex>
    <Text fontSize="xs" color="gray.600" mt="2">记者 {correction.requestedBy} 发起于 {correction.requestedAt.replace('T', ' ').slice(0, 16)}{correction.reviewedAt ? ` · ${correction.status === '已驳回' ? '处理' : '确认'}人 ${correction.reviewedBy} · ${correction.reviewedAt.replace('T', ' ').slice(0, 16)}` : ''}</Text>
    <Text fontSize="sm" mt="1">更正原因：{correction.reason}</Text>
    {correction.reviewNote && <Text fontSize="sm" mt="1" color={correction.status === '已驳回' ? 'red.700' : 'purple.700'}>{correction.status === '已驳回' ? '驳回' : '确认'}意见：{correction.reviewNote}</Text>}
    {oldSource && <>
      <Button size="xs" variant="link" colorScheme="purple" mt="2" onClick={() => setOpen((v) => !v)}>{open ? '收起两次来源差异' : '查看两次来源差异'}</Button>
      <Collapse in={open} animateOpacity={false}><Box mt="2"><SourceDiffTable oldSource={oldSource} newSource={correction.newSource} /></Box></Collapse>
    </>}
  </Box>
}

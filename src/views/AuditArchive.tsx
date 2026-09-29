import { useMemo, useState } from 'react'
import { Badge, Box, Button, Flex, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react'
import { CorrectionDiff } from '../components/CorrectionDiff'
import { useClaimStore } from '../store/useClaimStore'
import type { Claim } from '../types'

export function AuditArchive() {
  const state = useClaimStore()
  const [keyword, setKeyword] = useState('')
  const [snapshot, setSnapshot] = useState<Claim | null>(null)
  const match = (text: string) => text.toLowerCase().includes(keyword.toLowerCase())
  const rows = state.audit.filter((item) => match(`${item.claimId} ${item.action} ${item.operator} ${item.detail}`))
  const correctionRows = useMemo(() => state.corrections.filter((item) => {
    const claim = state.claims.find((claimItem) => claimItem.id === item.claimId)
    return match(`${item.id} ${item.claimId} ${item.factId} ${item.reason} ${item.requestedBy} ${item.confirmedBy ?? ''} ${item.newSource.title} ${claim?.title ?? ''}`)
  }), [state.corrections, state.claims, keyword])
  const versionRows = useMemo(() => state.versions.filter((item) => match(`${item.claimId} V${item.version} ${item.editor} ${item.summary} ${item.kind ?? ''}`)), [state.versions, keyword])
  const exportAll = () => {
    const payload = { generatedAt: new Date().toISOString(), claims: state.claims, versions: state.versions, corrections: state.corrections, audit: state.audit }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = '事实核查档案与审计.json'; anchor.click(); URL.revokeObjectURL(url)
  }
  const findOldSource = (correctionId: string, oldSourceId: string) => {
    const correction = state.corrections.find((item) => item.id === correctionId)
    const claim = state.claims.find((item) => item.id === correction?.claimId)
    return claim?.facts.flatMap((fact) => [...fact.sources, ...fact.counterSources, ...(fact.sourceHistory ?? [])]).find((source) => source.id === oldSourceId)
  }
  return <Box p="6" pb="16">
    <Flex justify="space-between" align="center" mb="5"><Box><Text fontSize="xs" color="gray.600">主张 / 来源更正 / 发布快照 / 批注 / 发布版本</Text><Text fontSize="xl" fontWeight="700" mt="1">核查档案与审计</Text></Box><Button colorScheme="teal" onClick={exportAll}>导出全部档案</Button></Flex>
    <Flex gap="3" mb="3"><Input maxW="460px" placeholder="搜索主张、更正、版本、操作人或说明" value={keyword} onChange={(event) => setKeyword(event.target.value)} /><Text alignSelf="center" fontSize="xs" color="gray.500">共{rows.length}条不可变审计事件 · {correctionRows.length}笔来源更正</Text></Flex>

    <Box bg="white" borderWidth="1px" mb="5">
      <Flex px="3" pt="3" pb="2" justify="space-between" align="center"><Text fontWeight="700">来源更正记录</Text><Text fontSize="xs" color="gray.500">旧来源不覆盖、不删除；可查两次来源差异与确认人</Text></Flex>
      <Table size="sm"><Thead><Tr><Th>时间</Th><Th>主张/事实</Th><Th>状态</Th><Th>旧来源 → 新材料</Th><Th>申请人</Th><Th>确认人</Th></Tr></Thead><Tbody>{correctionRows.map((item) => {
        const claim = state.claims.find((claimItem) => claimItem.id === item.claimId)
        return <Tr key={item.id}><Td fontSize="xs">{item.requestedAt.replace('T', ' ').slice(0, 16)}</Td><Td fontFamily="mono" fontSize="xs">{item.claimId}<br />{item.factId}{claim && <><br /><Text as="span" color="gray.500">{claim.title}</Text></>}</Td><Td><Badge colorScheme={item.status === '已确认' ? 'green' : item.status === '待编辑确认' ? 'orange' : 'red'}>{item.status}</Badge></Td><Td><Text fontSize="xs" color="orange.700">{item.oldSourceId} {findOldSource(item.id, item.oldSourceId)?.title ?? '（见发布快照）'}</Text><Text fontSize="xs" color="green.700">→ {item.newSourceId} {item.newSource.title}</Text></Td><Td>{item.requestedBy}</Td><Td>{item.confirmedBy ? <>{item.confirmedBy}<br /><Text as="span" fontSize="xs" color="gray.500">{item.confirmedAt?.replace('T', ' ').slice(0, 16)}</Text></> : item.rejectedBy ? <Text color="red.600">{item.rejectedBy}（驳回）</Text> : <Text color="orange.600">待编辑确认</Text>}</Td></Tr>
      })}{correctionRows.length === 0 && <Tr><Td colSpan={6}><Text fontSize="sm" color="gray.500" p="2">没有匹配的来源更正记录</Text></Td></Tr>}</Tbody></Table>
      <Box px="3" pb="3">{correctionRows.map((item) => <CorrectionDiff key={item.id} correction={item} oldSource={findOldSource(item.id, item.oldSourceId)} />)}</Box>
    </Box>

    <Box bg="white" borderWidth="1px" mb="5">
      <Flex px="3" pt="3" pb="2" justify="space-between" align="center"><Text fontWeight="700">版本记录</Text><Text fontSize="xs" color="gray.500">发布版本带冻结快照，更正只追加新版本</Text></Flex>
      <Table size="sm"><Thead><Tr><Th>时间</Th><Th>主张</Th><Th>版本</Th><Th>类型</Th><Th>说明</Th><Th>操作人</Th><Th>发布档案</Th></Tr></Thead><Tbody>{versionRows.map((item) => <Tr key={item.id}><Td fontSize="xs">{item.createdAt.replace('T', ' ').slice(0, 16)}</Td><Td fontFamily="mono" fontSize="xs">{item.claimId}</Td><Td fontWeight="700">V{item.version}</Td><Td><Badge colorScheme={item.kind === '来源更正' ? 'orange' : 'blue'}>{item.kind ?? '状态流转'}</Badge></Td><Td fontSize="sm" maxW="420px">{item.summary}</Td><Td>{item.editor}</Td><Td>{item.publishedSnapshot ? <Button size="xs" variant="outline" colorScheme="green" onClick={() => setSnapshot(item.publishedSnapshot!)}>查看已发布快照</Button> : <Text fontSize="xs" color="gray.500">—</Text>}</Td></Tr>)}</Tbody></Table>
    </Box>

    <Box bg="white" borderWidth="1px"><Table size="sm"><Thead><Tr><Th>时间</Th><Th>主张</Th><Th>动作</Th><Th>操作人</Th><Th>说明</Th></Tr></Thead><Tbody>{rows.map((item) => <Tr key={item.id}><Td fontSize="xs">{item.createdAt.replace('T', ' ').slice(0, 16)}</Td><Td fontFamily="mono" fontSize="xs">{item.claimId}</Td><Td><Badge colorScheme={item.action.includes('驳回') ? 'red' : item.action.includes('更正') ? 'orange' : item.action.includes('相反') ? 'red' : item.action.includes('发布') ? 'green' : 'blue'}>{item.action}</Badge></Td><Td>{item.operator}</Td><Td fontSize="sm">{item.detail}</Td></Tr>)}</Tbody></Table></Box>
    <Box mt="5" bg="white" borderWidth="1px" p="4"><Text fontWeight="700">版本差异原则</Text><Text fontSize="sm" color="gray.600" mt="2">来源更正采用「申请—确认」流程：记者选择来源、填写原因并关联新材料，编辑确认前报告继续显示原来源并标注待更正；确认后旧来源留在事实来源历史，当前事实改用新材料并生成更正版本。已发布档案（发布快照）不被改写，仍可查到两次来源差异、申请人与确认人。</Text></Box>

    <Modal isOpen={!!snapshot} onClose={() => setSnapshot(null)} size="3xl"><ModalOverlay /><ModalContent><ModalHeader>{snapshot?.id} 已发布报告快照（V{snapshot?.version}，冻结不改写）</ModalHeader><ModalCloseButton /><ModalBody pb="5">
      {snapshot && <Box><Text fontSize="xs" color="gray.500">发布时间 {snapshot.updatedAt.replace('T', ' ').slice(0, 16)} · 编辑 {snapshot.editor}</Text><Text fontWeight="700" mt="1">{snapshot.title}</Text>
        {snapshot.facts.map((fact) => <Box key={fact.id} borderWidth="1px" p="3" mt="3"><Flex justify="space-between"><Text fontWeight="600" fontSize="sm">{fact.id} · {fact.text}</Text><Badge colorScheme="green">{fact.conclusion}</Badge></Flex>{[...fact.sources, ...fact.counterSources].map((source) => <Box key={source.id} mt="2" bg="gray.50" p="2"><Text fontSize="xs" fontWeight="600">{source.title}（{source.kind} · V{source.version}）</Text><Text fontSize="xs" color="gray.500">{source.publisher} · {source.contentHash}</Text></Box>)}{(fact.sourceHistory ?? []).length === 0 && <Text fontSize="xs" color="gray.400" mt="2">发布时无来源更正历史（后续更正不影响本快照）</Text>}</Box>)}
      </Box>}
    </ModalBody></ModalContent></Modal>
  </Box>
}

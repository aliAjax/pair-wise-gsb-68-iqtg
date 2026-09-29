import { Badge, Box, Button, Flex, Text, Textarea, useToast } from '@chakra-ui/react'
import { useState } from 'react'
import { CorrectionDiff } from '../components/CorrectionDiff'
import { useClaimStore } from '../store/useClaimStore'
import type { SourceCorrection } from '../types'

export function ReviewQueue() {
  const state = useClaimStore()
  const toast = useToast()
  const reviewClaims = state.claims.filter((claim) => claim.status === '待编辑复核' || claim.facts.some((fact) => fact.annotations.some((note) => !note.resolved)))
  const pendingCorrections = state.corrections.filter((item) => item.status === '待编辑确认')
  const approve = (claimId: string) => {
    const result = state.transitionClaim(claimId, '已发布', '编辑完成事实、来源与相反证据复核。')
    toast({ title: result.message, status: result.ok ? 'success' : 'error' })
  }
  return <Box p="6" pb="16">
    <Box mb="5"><Text fontSize="xs" color="gray.600">编辑审阅 / 争议证据 / 来源更正 / 发布前检查</Text><Text fontSize="xl" fontWeight="700" mt="1">复核队列</Text></Box>

    <Box mb="6">
      <Flex justify="space-between" align="center" mb="3"><Text fontWeight="700">来源更正待确认 ({pendingCorrections.length})</Text><Text fontSize="xs" color="gray.500">确认前报告继续显示原来源；确认后旧来源留存历史、当前事实改用新材料并生成更正版本</Text></Flex>
      {pendingCorrections.length === 0 && <Box bg="white" borderWidth="1px" p="4"><Text fontSize="sm" color="gray.500">暂无待确认的来源更正。</Text></Box>}
      <Flex direction="column" gap="3">{pendingCorrections.map((correction) => {
        const claim = state.claims.find((item) => item.id === correction.claimId)
        const fact = claim?.facts.find((item) => item.id === correction.factId)
        const old = fact ? [...fact.sources, ...fact.counterSources, ...(fact.sourceHistory ?? [])].find((source) => source.id === correction.oldSourceId) : undefined
        return <Box key={correction.id} bg="white" borderWidth="1px" borderColor="orange.300" p="4">
          <Flex justify="space-between" mb="2"><Box><Text fontFamily="mono" fontSize="xs" color="gray.500">{correction.claimId} · {correction.factId} · {correction.id}</Text><Text fontWeight="700" mt="1">{fact?.text ?? '事实已不存在'}</Text>{claim && <Badge mt="1" colorScheme={claim.status === '已发布' ? 'green' : 'orange'}>{claim.status} · 当前 V{claim.version}</Badge>}</Box></Flex>
          <CorrectionDiff correction={correction} oldSource={old} />
          <CorrectionActions correction={correction} onDone={(message, ok) => toast({ title: message, status: ok ? 'success' : 'error' })} />
        </Box>
      })}</Flex>
    </Box>

    <Text fontWeight="700" mb="3">发布复核</Text>
    <Flex direction="column" gap="3">{reviewClaims.map((claim) => {
      const unresolved = claim.facts.flatMap((fact) => fact.annotations.filter((note) => !note.resolved).map((note) => ({ fact, note })))
      const blocking = claim.facts.filter((fact) => fact.conclusion === '证据不足' && fact.unresolved.length)
      const claimCorrectionPending = pendingCorrections.some((item) => item.claimId === claim.id)
      return <Box key={claim.id} bg="white" borderWidth="1px" p="4">
        <Flex justify="space-between"><Box><Text fontFamily="mono" fontSize="xs" color="gray.500">{claim.id}</Text><Text fontWeight="700" mt="1">{claim.title}</Text></Box><Badge colorScheme="orange">{claim.status}</Badge></Flex>
        <Flex mt="4" gap="4"><Box flex="1"><Text fontSize="sm" fontWeight="600">未解决批注 {unresolved.length}</Text>{unresolved.map(({ fact, note }) => <Box key={note.id} bg="orange.50" p="2" mt="2"><Text fontSize="xs" color="gray.500">{fact.id} · {note.author}</Text><Text fontSize="sm">{note.content}</Text></Box>)}</Box><Box flex="1"><Text fontSize="sm" fontWeight="600">发布阻断 {blocking.length + (claimCorrectionPending ? 1 : 0)}</Text>{blocking.map((fact) => <Box key={fact.id} bg="red.50" p="2" mt="2"><Text fontSize="xs" color="gray.500">{fact.id}</Text><Text fontSize="sm">{fact.unresolved.join('；')}</Text></Box>)}{claimCorrectionPending && <Box bg="red.50" p="2" mt="2"><Text fontSize="sm">存在待确认的来源更正申请，需先处理再发布</Text></Box>}</Box></Flex>
        {(blocking.length > 0 || claimCorrectionPending) && <Button mt="4" size="sm" colorScheme="teal" isDisabled onClick={() => approve(claim.id)}>发布前校验未通过</Button>}
        {(blocking.length === 0 && !claimCorrectionPending) && <Button mt="4" size="sm" colorScheme="teal" onClick={() => approve(claim.id)}>批准发布并锁定版本</Button>}
      </Box>
    })}</Flex>
  </Box>
}

function CorrectionActions({ correction, onDone }: { correction: SourceCorrection; onDone: (message: string, ok: boolean) => void }) {
  const confirm = useClaimStore((state) => state.confirmSourceCorrection)
  const reject = useClaimStore((state) => state.rejectSourceCorrection)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const editor = '宋卓'
  return <Box borderTopWidth="1px" pt="3">
    {!rejecting && <Flex gap="2" justify="flex-end"><Button size="sm" variant="outline" colorScheme="red" onClick={() => setRejecting(true)}>驳回</Button><Button size="sm" colorScheme="teal" onClick={() => { const result = confirm(correction.id, editor); onDone(result.message, result.ok) }}>确认更正并生成新版本</Button></Flex>}
    {rejecting && <Box><Textarea rows={2} size="sm" placeholder="驳回理由（必填），报告将继续引用原来源" value={reason} onChange={(event) => setReason(event.target.value)} /><Flex gap="2" justify="flex-end" mt="2"><Button size="sm" variant="ghost" onClick={() => { setRejecting(false); setReason('') }}>取消</Button><Button size="sm" colorScheme="red" isDisabled={!reason.trim()} onClick={() => { const result = reject(correction.id, editor, reason); onDone(result.message, result.ok); if (result.ok) { setRejecting(false); setReason('') } }}>确认驳回</Button></Flex></Box>}
  </Box>
}

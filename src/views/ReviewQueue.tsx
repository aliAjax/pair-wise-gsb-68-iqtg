import { useState } from 'react'
import { Badge, Box, Button, Collapse, Flex, Text, Textarea, useToast } from '@chakra-ui/react'
import { SourceDiffTable } from '../components/SourceDiffTable'
import { findSourceInClaim } from '../utils/source'
import { useClaimStore } from '../store/useClaimStore'

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
    <Box mb="5"><Text fontSize="xs" color="gray.600">编辑审阅 / 争议证据 / 来源更正确认 / 发布前检查</Text><Text fontSize="xl" fontWeight="700" mt="1">复核队列</Text></Box>

    <Box mb="6">
      <Flex align="center" gap="2" mb="3"><Text fontWeight="700">来源更正确认</Text><Badge colorScheme="purple">{pendingCorrections.length}</Badge><Text fontSize="xs" color="gray.500">确认前报告继续显示原来源；确认后旧来源留档、生成更正版本，已发布档案不改写</Text></Flex>
      <Flex direction="column" gap="3">{pendingCorrections.map((correction) => {
        const claim = state.claims.find((item) => item.id === correction.claimId)
        const fact = claim?.facts.find((item) => item.id === correction.factId)
        const oldSource = claim ? findSourceInClaim(claim, correction.oldSourceId) : undefined
        return <PendingCorrectionCard key={correction.id} correctionId={correction.id} claimId={correction.claimId} claimTitle={claim?.title ?? ''} factText={fact?.text ?? ''} oldTitle={oldSource?.title ?? correction.oldSourceId} newTitle={correction.newSource.title} reason={correction.reason} requestedBy={correction.requestedBy} requestedAt={correction.requestedAt} hasOld={!!oldSource} />
      })}{pendingCorrections.length === 0 && <Box bg="white" borderWidth="1px" p="4"><Text fontSize="sm" color="gray.500">暂无待确认的来源更正。</Text></Box>}</Flex>
    </Box>

    <Text fontWeight="700" mb="3">主张复核与发布</Text>
    <Flex direction="column" gap="3">{reviewClaims.map((claim) => {
      const unresolved = claim.facts.flatMap((fact) => fact.annotations.filter((note) => !note.resolved).map((note) => ({ fact, note })))
      const blocking = claim.facts.filter((fact) => fact.conclusion === '证据不足' && fact.unresolved.length)
      return <Box key={claim.id} bg="white" borderWidth="1px" p="4">
        <Flex justify="space-between"><Box><Text fontFamily="mono" fontSize="xs" color="gray.500">{claim.id}</Text><Text fontWeight="700" mt="1">{claim.title}</Text></Box><Badge colorScheme="orange">{claim.status}</Badge></Flex>
        <Flex mt="4" gap="4"><Box flex="1"><Text fontSize="sm" fontWeight="600">未解决批注 {unresolved.length}</Text>{unresolved.map(({ fact, note }) => <Box key={note.id} bg="orange.50" p="2" mt="2"><Text fontSize="xs" color="gray.500">{fact.id} · {note.author}</Text><Text fontSize="sm">{note.content}</Text></Box>)}</Box><Box flex="1"><Text fontSize="sm" fontWeight="600">发布阻断 {blocking.length}</Text>{blocking.map((fact) => <Box key={fact.id} bg="red.50" p="2" mt="2"><Text fontSize="xs" color="gray.500">{fact.id}</Text><Text fontSize="sm">{fact.unresolved.join('；')}</Text></Box>)}</Box></Flex>
        {blocking.length > 0 && <Button mt="4" size="sm" colorScheme="teal" isDisabled onClick={() => approve(claim.id)}>发布前校验未通过</Button>}
        {blocking.length === 0 && <Button mt="4" size="sm" colorScheme="teal" onClick={() => approve(claim.id)}>批准发布并锁定版本</Button>}
      </Box>
    })}</Flex>
  </Box>
}

function PendingCorrectionCard({ correctionId, claimId, claimTitle, factText, oldTitle, newTitle, reason, requestedBy, requestedAt, hasOld }: { correctionId: string; claimId: string; claimTitle: string; factText: string; oldTitle: string; newTitle: string; reason: string; requestedBy: string; requestedAt: string; hasOld: boolean }) {
  const state = useClaimStore()
  const toast = useToast()
  const [showDiff, setShowDiff] = useState(false)
  const [note, setNote] = useState('')
  const claim = state.claims.find((item) => item.id === claimId)
  const correction = state.corrections.find((item) => item.id === correctionId)
  const oldSource = claim ? findSourceInClaim(claim, correction?.oldSourceId ?? '') : undefined
  const confirm = () => {
    const result = state.confirmSourceCorrection(correctionId, '宋卓', note || '编辑已核对新旧材料，确认来源更正。')
    toast({ title: result.message, status: result.ok ? 'success' : 'error' })
    if (result.ok) { setNote(''); setShowDiff(false) }
  }
  const reject = () => {
    const result = state.rejectSourceCorrection(correctionId, '宋卓', note)
    toast({ title: result.message, status: result.ok ? 'success' : 'error' })
    if (result.ok) { setNote(''); setShowDiff(false) }
  }
  return <Box bg="white" borderWidth="1px" borderColor="purple.200" p="4">
    <Flex justify="space-between" align="flex-start"><Box><Text fontFamily="mono" fontSize="xs" color="gray.500">{correctionId} · {claimId}</Text><Text fontWeight="700" mt="1">{claimTitle}</Text><Text fontSize="sm" color="gray.600" mt="1">事实：{factText}</Text></Box><Badge colorScheme="orange">待编辑确认</Badge></Flex>
    <Box mt="3" p="3" bg="orange.50" borderWidth="1px" borderColor="orange.200">
      <Text fontSize="sm">原来源：<b>{oldTitle}</b>（报告当前仍显示此来源）</Text>
      <Text fontSize="sm" mt="1">新材料：<b>{newTitle}</b></Text>
      <Text fontSize="xs" color="gray.600" mt="2">{requestedBy}（记者）发起于 {requestedAt.replace('T', ' ').slice(0, 16)} · 更正原因：{reason}</Text>
    </Box>
    {hasOld && oldSource && correction && <>
      <Button size="xs" variant="link" colorScheme="purple" mt="2" onClick={() => setShowDiff((v) => !v)}>{showDiff ? '收起两次来源差异' : '查看两次来源差异'}</Button>
      <Collapse in={showDiff} animateOpacity={false}><Box mt="2"><SourceDiffTable oldSource={oldSource} newSource={correction.newSource} /></Box></Collapse>
    </>}
    <Textarea mt="3" size="sm" rows={2} placeholder="编辑确认/驳回意见（读者可在更正记录中查看）" value={note} onChange={(event) => setNote(event.target.value)} />
    <Flex mt="3" gap="2" justify="flex-end">
      <Button size="sm" colorScheme="red" variant="outline" isDisabled={!note.trim()} onClick={reject}>驳回，继续显示原来源</Button>
      <Button size="sm" colorScheme="purple" onClick={confirm}>确认更正（旧来源留档并生成更正版本）</Button>
    </Flex>
  </Box>
}

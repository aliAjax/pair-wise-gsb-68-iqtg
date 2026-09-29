import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, AlertIcon, Badge, Box, Button, Divider, Flex, FormControl, FormLabel, Grid, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea, useDisclosure, useToast } from '@chakra-ui/react'
import { EvidenceGraph } from '../components/EvidenceGraph'
import { CorrectionDiff } from '../components/CorrectionDiff'
import { conclusionColor, useClaimStore } from '../store/useClaimStore'
import type { ClaimFact, EvidenceKind, FactConclusion, SourceCorrection, SourceRecord } from '../types'

export function ClaimWorkspace() {
  const { id } = useParams()
  const toast = useToast()
  const state = useClaimStore()
  const claim = state.claims.find((item) => item.id === id)
  const [selectedFactId, setSelectedFactId] = useState(claim?.facts[0]?.id ?? '')
  const selectedFact = claim?.facts.find((item) => item.id === selectedFactId) ?? claim?.facts[0]
  const [factText, setFactText] = useState('')
  const sourceModal = useDisclosure()
  const correctionModal = useDisclosure()
  const versionModal = useDisclosure()
  const [sourceForm, setSourceForm] = useState<Omit<SourceRecord, 'id' | 'capturedAt' | 'version'>>({ title: '', url: '', publisher: '', publishedAt: '2026-09-29', kind: '原始证据', chainOfCustody: '', contentHash: '' })
  const [counterSource, setCounterSource] = useState(false)
  const [transitionNote, setTransitionNote] = useState('')
  useEffect(() => { if (!selectedFactId && claim?.facts[0]) setSelectedFactId(claim.facts[0].id) }, [selectedFactId, claim])
  if (!claim) return <Box p="10">未找到核查主张</Box>
  const factCorrections = (factId: string) => state.corrections.filter((item) => item.claimId === claim!.id && item.factId === factId)
  const claimPendingCorrections = state.corrections.filter((item) => item.claimId === claim.id && item.status === '待编辑确认')
  const claimVersions = state.versions.filter((item) => item.claimId === claim.id)
  const setFact = (patch: Partial<ClaimFact>) => { if (selectedFact) state.updateFact(claim.id, selectedFact.id, patch) }
  const addSource = () => {
    if (!selectedFact || !sourceForm.title || !sourceForm.url) return
    state.addSource(claim.id, selectedFact.id, sourceForm, counterSource)
    sourceModal.onClose()
    toast({ title: '证据已加入关系图', status: 'success' })
  }
  // 来源更正申请
  const [correctionTarget, setCorrectionTarget] = useState<{ source: SourceRecord; counter: boolean } | null>(null)
  const [correctionReason, setCorrectionReason] = useState('')
  const [correctionForm, setCorrectionForm] = useState<Omit<SourceRecord, 'id' | 'capturedAt' | 'version' | 'supersededBy'>>({ title: '', url: '', publisher: '', publishedAt: '2026-09-29', kind: '原始证据', chainOfCustody: '', contentHash: '' })
  const openCorrection = (source: SourceRecord, counter: boolean) => {
    setCorrectionTarget({ source, counter })
    setCorrectionReason('')
    setCorrectionForm({ title: '', url: '', publisher: '', publishedAt: '2026-09-29', kind: source.kind, chainOfCustody: '', contentHash: '' })
    correctionModal.onOpen()
  }
  const submitCorrection = () => {
    if (!selectedFact || !correctionTarget) return
    const result = state.requestSourceCorrection({ claimId: claim.id, factId: selectedFact.id, oldSourceId: correctionTarget.source.id, counter: correctionTarget.counter, reason: correctionReason, newSource: correctionForm })
    toast({ title: result.message, status: result.ok ? 'success' : 'error' })
    if (result.ok) correctionModal.onClose()
  }
  const transition = (status: typeof claim.status) => {
    const result = state.transitionClaim(claim.id, status, transitionNote || `由${claim.status}流转至${status}`)
    toast({ title: result.message, status: result.ok ? 'success' : 'error' })
    if (result.ok) versionModal.onClose()
  }
  const exportArchive = () => {
    const versions = state.versions.filter((item) => item.claimId === claim.id)
    const audit = state.audit.filter((item) => item.claimId === claim.id)
    const corrections = state.corrections.filter((item) => item.claimId === claim.id)
    const blob = new Blob([JSON.stringify({ claim, versions, corrections, audit }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${claim.id}-核查档案.json`; anchor.click(); URL.revokeObjectURL(url)
  }
  return <Box p="6" pb="16">
    <Flex justify="space-between" align="flex-start" mb="4"><Box><Text fontSize="xs" color="gray.600">{claim.id} · {claim.reporter} / {claim.editor} · V{claim.version}</Text><Text fontSize="xl" fontWeight="700" mt="1">{claim.title}</Text><Text color="gray.600" fontSize="sm" mt="2" maxW="760px">{claim.summary}</Text></Box><Flex gap="2"><Button variant="outline" onClick={exportArchive}>导出档案</Button><Button colorScheme="teal" onClick={versionModal.onOpen}>状态与版本</Button></Flex></Flex>
    {claim.status === '已发布' && <Alert status="info" mb="3" py="2" fontSize="sm"><AlertIcon />已发布报告档案已冻结，来源更正只会生成新版本；编辑确认前，报告继续显示原来源。</Alert>}
    {claimPendingCorrections.length > 0 && <Alert status="warning" mb="3" py="2"><AlertIcon /><Text fontSize="sm">本报告有 {claimPendingCorrections.length} 项来源更正待编辑确认，当前事实仍引用原来源，已发布档案不被改写。</Text></Alert>}
    <EvidenceGraph facts={claim.facts} />
    <Grid mt="4" templateColumns="320px 1fr" gap="4" alignItems="start">
      <Box bg="white" borderWidth="1px" p="3">
        <Flex justify="space-between" align="center" mb="3"><Text fontWeight="700">可验证事实树</Text><Badge>{claim.facts.length}</Badge></Flex>
        {claim.facts.map((fact) => {
          const pending = factCorrections(fact.id).filter((item) => item.status === '待编辑确认').length
          return <Box key={fact.id} as="button" textAlign="left" w="100%" p="3" mb="2" borderWidth="1px" borderColor={fact.id === selectedFact?.id ? 'teal.600' : 'gray.200'} bg={fact.id === selectedFact?.id ? 'teal.50' : 'white'} onClick={() => setSelectedFactId(fact.id)}><Flex justify="space-between"><Text fontSize="xs" color="gray.500">{fact.id}</Text><Badge colorScheme={conclusionColor[fact.conclusion]}>{fact.conclusion}</Badge></Flex><Text fontSize="sm" mt="2" fontWeight="600">{fact.text}</Text><Flex justify="space-between" mt="2"><Text fontSize="xs" color="gray.500">置信度 {fact.confidence}% · 疑点 {fact.unresolved.length}</Text>{pending > 0 && <Badge colorScheme="orange">{pending} 待更正</Badge>}</Flex></Box>
        })}
        <Flex mt="3" gap="2"><Input size="sm" placeholder="拆出新的可验证事实" value={factText} onChange={(event) => setFactText(event.target.value)} /><Button size="sm" colorScheme="teal" onClick={() => { state.addFact(claim.id, factText); setFactText('') }}>添加</Button></Flex>
      </Box>
      {selectedFact && <Box bg="white" borderWidth="1px" p="4">
        <Flex justify="space-between" align="flex-start"><Box><Text fontSize="xs" color="gray.500">{selectedFact.id}</Text><Text fontWeight="700" mt="1">{selectedFact.text}</Text></Box><Badge colorScheme={conclusionColor[selectedFact.conclusion]}>{selectedFact.conclusion}</Badge></Flex>
        {factCorrections(selectedFact.id).some((item) => item.status === '待编辑确认') && <Alert status="warning" mt="3" py="2"><AlertIcon /><Text fontSize="xs">该事实的来源更正申请待编辑确认，下方继续显示原来源，并标注「待更正」。</Text></Alert>}
        <Grid templateColumns="1fr 1fr 1fr" gap="3" mt="4">
          <FormControl><FormLabel fontSize="xs">事实结论</FormLabel><Select size="sm" value={selectedFact.conclusion} onChange={(event) => setFact({ conclusion: event.target.value as FactConclusion })}>{['已证实', '部分属实', '证据不足', '不实'].map((value) => <option key={value}>{value}</option>)}</Select></FormControl>
          <FormControl><FormLabel fontSize="xs">置信程度 {selectedFact.confidence}%</FormLabel><Input size="sm" type="range" min="0" max="100" value={selectedFact.confidence} onChange={(event) => setFact({ confidence: Number(event.target.value) })} /></FormControl>
          <FormControl><FormLabel fontSize="xs">未解决疑点</FormLabel><Input size="sm" value={selectedFact.unresolved.join('；')} onChange={(event) => setFact({ unresolved: event.target.value ? event.target.value.split('；') : [] })} /></FormControl>
        </Grid>
        <Tabs mt="5" colorScheme="teal">
          <TabList><Tab>支持证据 {selectedFact.sources.length}</Tab><Tab>相反证据 {selectedFact.counterSources.length}</Tab><Tab>批注 {selectedFact.annotations.length}</Tab><Tab>来源更正 {factCorrections(selectedFact.id).length}</Tab><Tab>来源时间线</Tab></TabList>
          <TabPanels>
            <TabPanel px="0"><EvidenceList sources={selectedFact.sources} corrections={factCorrections(selectedFact.id)} onAdd={() => { setCounterSource(false); sourceModal.onOpen() }} onCorrect={(source) => openCorrection(source, false)} canCorrect={claim.status !== '已撤回'} /></TabPanel>
            <TabPanel px="0"><EvidenceList sources={selectedFact.counterSources} corrections={factCorrections(selectedFact.id)} counter onAdd={() => { setCounterSource(true); sourceModal.onOpen() }} onCorrect={(source) => openCorrection(source, true)} canCorrect={claim.status !== '已撤回'} /></TabPanel>
            <TabPanel px="0"><AnnotationList fact={selectedFact} claimId={claim.id} /></TabPanel>
            <TabPanel px="0"><CorrectionPanel fact={selectedFact} corrections={factCorrections(selectedFact.id)} /></TabPanel>
            <TabPanel px="0"><Timeline fact={selectedFact} corrections={factCorrections(selectedFact.id)} /></TabPanel>
          </TabPanels>
        </Tabs>
      </Box>}
    </Grid>
    <Modal isOpen={sourceModal.isOpen} onClose={sourceModal.onClose} size="xl"><ModalOverlay /><ModalContent><ModalHeader>{counterSource ? '关联相反证据' : '关联支持证据'}</ModalHeader><ModalCloseButton /><ModalBody><Grid templateColumns="1fr 1fr" gap="3"><FormControl><FormLabel>来源标题</FormLabel><Input value={sourceForm.title} onChange={(event) => setSourceForm({ ...sourceForm, title: event.target.value })} /></FormControl><FormControl><FormLabel>公开地址</FormLabel><Input value={sourceForm.url} onChange={(event) => setSourceForm({ ...sourceForm, url: event.target.value })} /></FormControl><FormControl><FormLabel>发布机构</FormLabel><Input value={sourceForm.publisher} onChange={(event) => setSourceForm({ ...sourceForm, publisher: event.target.value })} /></FormControl><FormControl><FormLabel>证据类型</FormLabel><Select value={sourceForm.kind} onChange={(event) => setSourceForm({ ...sourceForm, kind: event.target.value as EvidenceKind })}>{['原始证据', '二次来源', '待证信息'].map((value) => <option key={value}>{value}</option>)}</Select></FormControl><FormControl><FormLabel>内容哈希</FormLabel><Input placeholder="sha256:..." value={sourceForm.contentHash} onChange={(event) => setSourceForm({ ...sourceForm, contentHash: event.target.value })} /></FormControl><FormControl><FormLabel>留档说明</FormLabel><Input value={sourceForm.chainOfCustody} onChange={(event) => setSourceForm({ ...sourceForm, chainOfCustody: event.target.value })} /></FormControl></Grid></ModalBody><ModalFooter><Button variant="ghost" mr="3" onClick={sourceModal.onClose}>取消</Button><Button colorScheme="teal" isDisabled={!sourceForm.title || !sourceForm.url} onClick={addSource}>加入证据关系图</Button></ModalFooter></ModalContent></Modal>
    <Modal isOpen={correctionModal.isOpen} onClose={correctionModal.onClose} size="2xl"><ModalOverlay /><ModalContent><ModalHeader>申请来源更正</ModalHeader><ModalCloseButton /><ModalBody>
      {claim.status === '已发布' && <Alert status="info" mb="3" py="2" fontSize="xs"><AlertIcon />已发布档案不会被改写；编辑确认后生成更正版本，旧来源保留在历史中。</Alert>}
      {correctionTarget && <Box borderWidth="1px" borderColor="orange.300" bg="orange.50" p="3" mb="3"><Text fontSize="xs" color="gray.500">待更正的原来源 · {correctionTarget.source.id}</Text><Text fontWeight="600" fontSize="sm" mt="1">{correctionTarget.source.title}</Text><Text fontSize="xs" color="gray.600">{correctionTarget.source.publisher} · {correctionTarget.source.url}</Text></Box>}
      <FormControl mb="3"><FormLabel fontSize="sm">更正原因（必填）</FormLabel><Textarea rows={2} placeholder="例如：发布后收到更正材料，原来源为转载版本，需替换为主管部门正式文件" value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} /></FormControl>
      <Divider my="3" /><Text fontWeight="600" fontSize="sm" mb="2">关联新材料</Text>
      <Grid templateColumns="1fr 1fr" gap="3">
        <FormControl><FormLabel fontSize="xs">材料标题</FormLabel><Input value={correctionForm.title} onChange={(event) => setCorrectionForm({ ...correctionForm, title: event.target.value })} /></FormControl>
        <FormControl><FormLabel fontSize="xs">公开地址</FormLabel><Input value={correctionForm.url} onChange={(event) => setCorrectionForm({ ...correctionForm, url: event.target.value })} /></FormControl>
        <FormControl><FormLabel fontSize="xs">发布机构</FormLabel><Input value={correctionForm.publisher} onChange={(event) => setCorrectionForm({ ...correctionForm, publisher: event.target.value })} /></FormControl>
        <FormControl><FormLabel fontSize="xs">发布日期</FormLabel><Input type="date" value={correctionForm.publishedAt} onChange={(event) => setCorrectionForm({ ...correctionForm, publishedAt: event.target.value })} /></FormControl>
        <FormControl><FormLabel fontSize="xs">证据类型</FormLabel><Select value={correctionForm.kind} onChange={(event) => setCorrectionForm({ ...correctionForm, kind: event.target.value as EvidenceKind })}>{['原始证据', '二次来源', '待证信息'].map((value) => <option key={value}>{value}</option>)}</Select></FormControl>
        <FormControl><FormLabel fontSize="xs">内容哈希</FormLabel><Input placeholder="sha256:..." value={correctionForm.contentHash} onChange={(event) => setCorrectionForm({ ...correctionForm, contentHash: event.target.value })} /></FormControl>
        <FormControl gridColumn="1 / -1"><FormLabel fontSize="xs">保管链/留档说明</FormLabel><Input value={correctionForm.chainOfCustody} onChange={(event) => setCorrectionForm({ ...correctionForm, chainOfCustody: event.target.value })} /></FormControl>
      </Grid>
    </ModalBody><ModalFooter><Button variant="ghost" mr="3" onClick={correctionModal.onClose}>取消</Button><Button colorScheme="orange" isDisabled={!correctionReason.trim() || !correctionForm.title || !correctionForm.url} onClick={submitCorrection}>提交更正申请</Button></ModalFooter></ModalContent></Modal>
    <Modal isOpen={versionModal.isOpen} onClose={versionModal.onClose} size="xl"><ModalOverlay /><ModalContent><ModalHeader>状态流转与版本说明</ModalHeader><ModalCloseButton /><ModalBody>
          <Box mb="4">{claimVersions.length === 0 && <Text fontSize="xs" color="gray.500">暂无版本记录</Text>}{claimVersions.map((version) => <Flex key={version.id} justify="space-between" borderWidth="1px" p="2" mb="2"><Box><Flex gap="2" align="center"><Text fontWeight="700" fontSize="sm">V{version.version}</Text><Badge colorScheme={version.kind === '来源更正' ? 'orange' : 'blue'}>{version.kind ?? '状态流转'}</Badge>{version.publishedSnapshot && <Badge colorScheme="green">含发布快照</Badge>}</Flex><Text fontSize="xs" color="gray.600" mt="1">{version.summary}</Text><Text fontSize="xs" color="gray.500" mt="1">{version.editor} · {version.createdAt.replace('T', ' ').slice(0, 16)}</Text></Box></Flex>)}</Box>
          <Divider my="3" />
          <FormControl mb="4"><FormLabel>新版本变更说明</FormLabel><Textarea rows={3} value={transitionNote} onChange={(event) => setTransitionNote(event.target.value)} /></FormControl><Text fontSize="xs" color="gray.500">待编辑复核需要至少一项事实；存在待确认来源更正或发布校验未通过时不能发布。</Text></ModalBody><ModalFooter><Button mr="2" onClick={() => transition('待编辑复核')}>提交编辑复核</Button><Button colorScheme="teal" onClick={() => transition('已发布')}>发布正式版本</Button></ModalFooter></ModalContent></Modal>
  </Box>
}

function EvidenceList({ sources, corrections, onAdd, onCorrect, canCorrect, counter = false }: { sources: SourceRecord[]; corrections: SourceCorrection[]; onAdd: () => void; onCorrect: (source: SourceRecord) => void; canCorrect: boolean; counter?: boolean }) {
  const pendingBySource = new Map<string, SourceCorrection>()
  corrections.filter((item) => item.status === '待编辑确认' && item.counter === counter).forEach((item) => pendingBySource.set(item.oldSourceId, item))
  return <Box>
    <Flex justify="space-between" mb="3">
      <Text fontSize="sm" color="gray.600">{counter ? '相反证据与支持证据并列保留' : '按原始证据、二次来源、待证信息分类'}</Text>
      <Button size="sm" colorScheme={counter ? 'red' : 'teal'} variant="outline" onClick={onAdd}>{counter ? '关联相反证据' : '关联支持证据'}</Button>
    </Flex>
    {sources.map((source) => {
      const pending = pendingBySource.get(source.id)
      return <Box key={source.id} borderWidth="1px" borderColor={pending ? 'orange.400' : 'gray.200'} bg={pending ? 'orange.50' : 'white'} p="3" mb="2">
        <Flex justify="space-between">
          <Text fontWeight="600">{source.title}</Text>
          <Flex gap="1" align="center">
            {pending ? <Badge colorScheme="orange">待更正</Badge> : null}
            <Badge colorScheme={source.kind === '原始证据' ? 'green' : source.kind === '二次来源' ? 'orange' : 'gray'}>{source.kind}</Badge>
          </Flex>
        </Flex>
        <Text fontSize="xs" color="gray.600" mt="2">{source.publisher} · {source.publishedAt} · V{source.version}</Text>
        {pending ? <Text fontSize="xs" color="orange.700" mt="1">更正申请 {pending.id} 待编辑确认：{pending.newSource.title}；确认前报告继续引用本原来源。</Text> : null}
        <Text fontFamily="mono" fontSize="xs" mt="2">{source.contentHash}</Text>
        <Divider my="2" />
        <Text fontSize="xs">{source.chainOfCustody}</Text>
        <Text fontSize="xs" color="blue.600" mt="1" wordBreak="break-all">{source.url}</Text>
        {canCorrect ? <Flex justify="flex-end" mt="2"><Button size="xs" variant="outline" colorScheme="orange" isDisabled={!!pending} onClick={() => onCorrect(source)}>{pending ? '已有待确认更正' : '申请来源更正'}</Button></Flex> : null}
      </Box>
    })}
  </Box>
}

function CorrectionPanel({ fact, corrections }: { fact: ClaimFact; corrections: SourceCorrection[] }) {
  if (corrections.length === 0) return <Text fontSize="sm" color="gray.500">暂无来源更正申请。记者可在支持证据/相反证据卡片上选择「申请来源更正」，填写原因并关联新材料；编辑确认前原来源保持不变。</Text>
  const findOld = (correction: SourceCorrection) =>
    [...fact.sources, ...fact.counterSources, ...(fact.sourceHistory ?? [])].find((source) => source.id === correction.oldSourceId)
  return <Box>
    {corrections.some((item) => item.status === '待编辑确认') && <Alert status="warning" mb="3" py="2"><AlertIcon /><Text fontSize="xs">待确认期间，当前事实继续显示原来源；确认后旧来源移入历史并生成更正版本。</Text></Alert>}
    {corrections.map((correction) => <CorrectionDiff key={correction.id} correction={correction} oldSource={findOld(correction)} />)}
  </Box>
}

function Timeline({ fact, corrections }: { fact: ClaimFact; corrections: SourceCorrection[] }) {
  const allSources = [...fact.sources, ...fact.counterSources, ...(fact.sourceHistory ?? [])]
  return <Box borderLeftWidth="2px" borderColor="gray.300" pl="4">
    {allSources.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)).map((source) => {
      const replaced = corrections.find((item) => item.oldSourceId === source.id && item.status === '已确认')
      const inHistory = (fact.sourceHistory ?? []).some((item) => item.id === source.id)
      return <Box key={source.id} mb="4">
        <Flex justify="space-between"><Text fontSize="xs" color="gray.500">{source.publishedAt} · {source.kind}</Text>{inHistory && <Badge colorScheme="orange">已替代入历史</Badge>}</Flex>
        <Text fontWeight="600" mt="1">{source.title}</Text>
        <Text fontSize="sm" color="gray.600">{source.publisher} · 留档 {source.capturedAt.replace('T', ' ').slice(0, 16)}</Text>
        {replaced && <Text fontSize="xs" color="orange.700" mt="1">已由 {replaced.newSourceId}「{replaced.newSource.title}」替代 · 确认人 {replaced.confirmedBy} · {replaced.confirmedAt?.replace('T', ' ').slice(0, 16)}</Text>}
      </Box>
    })}
  </Box>
}

function AnnotationList({ fact, claimId }: { fact: ClaimFact; claimId: string }) {
  const addAnnotation = useClaimStore((state) => state.addAnnotation)
  const resolve = useClaimStore((state) => state.resolveAnnotation)
  const [text, setText] = useState('')
  return <Box><Flex gap="2" mb="3"><Input placeholder="添加事实核查批注" value={text} onChange={(event) => setText(event.target.value)} /><Button onClick={() => { addAnnotation(claimId, fact.id, { author: '陆衡', role: '事实核查员', content: text }); setText('') }}>添加</Button></Flex>{fact.annotations.map((item) => <Box key={item.id} borderLeftWidth="3px" borderColor={item.resolved ? 'green.400' : 'orange.400'} bg={item.resolved ? 'green.50' : 'orange.50'} p="3" mb="2"><Flex justify="space-between"><Text fontWeight="600" fontSize="sm">{item.role} {item.author}</Text><Button size="xs" variant="ghost" isDisabled={item.resolved} onClick={() => resolve(claimId, fact.id, item.id)}>{item.resolved ? '已解决' : '标记解决'}</Button></Flex><Text fontSize="sm" mt="2">{item.content}</Text><Text fontSize="xs" color="gray.500" mt="1">{item.createdAt.replace('T', ' ').slice(0, 16)}</Text></Box>)}</Box>
}

import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { Badge, Box, Button, Collapse, Divider, Flex, FormControl, FormLabel, Grid, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea, useDisclosure, useToast } from '@chakra-ui/react'
import { EvidenceGraph } from '../components/EvidenceGraph'
import { SourceDiffTable } from '../components/SourceDiffTable'
import { conclusionColor, useClaimStore } from '../store/useClaimStore'
import { isActiveSource, findSourceInClaim } from '../utils/source'
import type { ClaimFact, EvidenceKind, FactConclusion, PublishedSnapshot, SourceCorrection, SourceRecord } from '../types'

type CorrectionTarget = { factId: string; counter: boolean; oldSourceId: string }

export function ClaimWorkspace() {
  const { id } = useParams()
  const toast = useToast()
  const state = useClaimStore()
  const claim = state.claims.find((item) => item.id === id)
  const [selectedFactId, setSelectedFactId] = useState(claim?.facts[0]?.id ?? '')
  const selectedFact = claim?.facts.find((item) => item.id === selectedFactId) ?? claim?.facts[0]
  const [factText, setFactText] = useState('')
  const sourceModal = useDisclosure()
  const versionModal = useDisclosure()
  const archiveModal = useDisclosure()
  const correctionModal = useDisclosure()
  const [sourceForm, setSourceForm] = useState<Omit<SourceRecord, 'id' | 'capturedAt' | 'version'>>({ title: '', url: '', publisher: '', publishedAt: '2026-09-29', kind: '原始证据', chainOfCustody: '', contentHash: '' })
  const [counterSource, setCounterSource] = useState(false)
  const [transitionNote, setTransitionNote] = useState('')
  const [correctionTarget, setCorrectionTarget] = useState<CorrectionTarget | null>(null)
  const [correctionReason, setCorrectionReason] = useState('')
  const [correctionForm, setCorrectionForm] = useState<Omit<SourceRecord, 'id' | 'capturedAt' | 'version'>>({ title: '', url: '', publisher: '', publishedAt: '2026-09-29', kind: '原始证据', chainOfCustody: '', contentHash: '' })
  useEffect(() => { if (!selectedFactId && claim?.facts[0]) setSelectedFactId(claim.facts[0].id) }, [selectedFactId, claim])
  if (!claim) return <Box p="10">未找到核查主张</Box>
  const claimVersions = state.versions.filter((item) => item.claimId === claim.id)
  const claimCorrections = state.corrections.filter((item) => item.claimId === claim.id)
  const snapshot: PublishedSnapshot | undefined = state.publishedSnapshots.find((item) => item.claimId === claim.id)
  const setFact = (patch: Partial<ClaimFact>) => { if (selectedFact) state.updateFact(claim.id, selectedFact.id, patch) }
  const addSource = () => {
    if (!selectedFact || !sourceForm.title || !sourceForm.url) return
    state.addSource(claim.id, selectedFact.id, sourceForm, counterSource)
    sourceModal.onClose()
    toast({ title: '证据已加入关系图', status: 'success' })
  }
  const openCorrection = (factId: string, counter: boolean, source: SourceRecord) => {
    setCorrectionTarget({ factId, counter, oldSourceId: source.id })
    setCorrectionReason('')
    setCorrectionForm({ title: '', url: '', publisher: source.publisher, publishedAt: '2026-09-29', kind: source.kind, chainOfCustody: '', contentHash: '' })
    correctionModal.onOpen()
  }
  const submitCorrection = () => {
    if (!correctionTarget) return
    const result = state.requestSourceCorrection({
      claimId: claim.id, factId: correctionTarget.factId, counter: correctionTarget.counter,
      oldSourceId: correctionTarget.oldSourceId, reason: correctionReason, requestedBy: claim.reporter, newSource: correctionForm
    })
    toast({ title: result.message, status: result.ok ? 'success' : 'error' })
    if (result.ok) { correctionModal.onClose(); setCorrectionTarget(null) }
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
    const blob = new Blob([JSON.stringify({ claim, versions, corrections, publishedSnapshot: snapshot ?? null, audit }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${claim.id}-核查档案.json`; anchor.click(); URL.revokeObjectURL(url)
  }
  return <Box p="6" pb="16">
    <Flex justify="space-between" align="flex-start" mb="4"><Box><Text fontSize="xs" color="gray.600">{claim.id} · {claim.reporter} / {claim.editor} · V{claim.version}</Text><Text fontSize="xl" fontWeight="700" mt="1">{claim.title}</Text><Text color="gray.600" fontSize="sm" mt="2" maxW="760px">{claim.summary}</Text></Box><Flex gap="2"><Button variant="outline" onClick={exportArchive}>导出档案</Button><Button variant="outline" colorScheme="purple" onClick={archiveModal.onOpen} isDisabled={!snapshot}>已发布档案{snapshot ? ` V${snapshot.version}` : ''}</Button><Button colorScheme="teal" onClick={versionModal.onOpen}>状态与版本</Button></Flex></Flex>
    <EvidenceGraph facts={claim.facts} corrections={claimCorrections} />
    <Grid mt="4" templateColumns="320px 1fr" gap="4" alignItems="start">
      <Box bg="white" borderWidth="1px" p="3">
        <Flex justify="space-between" align="center" mb="3"><Text fontWeight="700">可验证事实树</Text><Badge>{claim.facts.length}</Badge></Flex>
        {claim.facts.map((fact) => {
          const pending = state.corrections.filter((item) => item.claimId === claim.id && item.factId === fact.id && item.status === '待编辑确认').length
          return <Box key={fact.id} as="button" textAlign="left" w="100%" p="3" mb="2" borderWidth="1px" borderColor={fact.id === selectedFact?.id ? 'teal.600' : 'gray.200'} bg={fact.id === selectedFact?.id ? 'teal.50' : 'white'} onClick={() => setSelectedFactId(fact.id)}><Flex justify="space-between"><Text fontSize="xs" color="gray.500">{fact.id}</Text><Badge colorScheme={conclusionColor[fact.conclusion]}>{fact.conclusion}</Badge></Flex><Text fontSize="sm" mt="2" fontWeight="600">{fact.text}</Text><Text fontSize="xs" color="gray.500" mt="2">置信度 {fact.confidence}% · 疑点 {fact.unresolved.length}</Text>{pending > 0 && <Badge mt="2" colorScheme="purple">来源待更正 ×{pending}</Badge>}</Box>
        })}
        <Flex mt="3" gap="2"><Input size="sm" placeholder="拆出新的可验证事实" value={factText} onChange={(event) => setFactText(event.target.value)} /><Button size="sm" colorScheme="teal" onClick={() => { state.addFact(claim.id, factText); setFactText('') }}>添加</Button></Flex>
      </Box>
      {selectedFact && <Box bg="white" borderWidth="1px" p="4">
        <Flex justify="space-between" align="flex-start"><Box><Text fontSize="xs" color="gray.500">{selectedFact.id}</Text><Text fontWeight="700" mt="1">{selectedFact.text}</Text></Box><Badge colorScheme={conclusionColor[selectedFact.conclusion]}>{selectedFact.conclusion}</Badge></Flex>
        <PendingCorrectionNotice fact={selectedFact} corrections={claimCorrections.filter((item) => item.factId === selectedFact.id)} />
        <Grid templateColumns="1fr 1fr 1fr" gap="3" mt="4">
          <FormControl><FormLabel fontSize="xs">事实结论</FormLabel><Select size="sm" value={selectedFact.conclusion} onChange={(event) => setFact({ conclusion: event.target.value as FactConclusion })}>{['已证实', '部分属实', '证据不足', '不实'].map((value) => <option key={value}>{value}</option>)}</Select></FormControl>
          <FormControl><FormLabel fontSize="xs">置信程度 {selectedFact.confidence}%</FormLabel><Input size="sm" type="range" min="0" max="100" value={selectedFact.confidence} onChange={(event) => setFact({ confidence: Number(event.target.value) })} /></FormControl>
          <FormControl><FormLabel fontSize="xs">未解决疑点</FormLabel><Input size="sm" value={selectedFact.unresolved.join('；')} onChange={(event) => setFact({ unresolved: event.target.value ? event.target.value.split('；') : [] })} /></FormControl>
        </Grid>
        <Tabs mt="5" colorScheme="teal">
          <TabList><Tab>{tabLabel('支持证据', selectedFact.sources)}</Tab><Tab>{tabLabel('相反证据', selectedFact.counterSources)}</Tab><Tab>批注 {selectedFact.annotations.length}</Tab><Tab>来源时间线</Tab></TabList>
          <TabPanels>
            <TabPanel px="0"><EvidenceList sources={selectedFact.sources} factId={selectedFact.id} corrections={claimCorrections} onAdd={() => { setCounterSource(false); sourceModal.onOpen() }} onCorrect={(source) => openCorrection(selectedFact.id, false, source)} /></TabPanel>
            <TabPanel px="0"><EvidenceList sources={selectedFact.counterSources} factId={selectedFact.id} corrections={claimCorrections} counter onAdd={() => { setCounterSource(true); sourceModal.onOpen() }} onCorrect={(source) => openCorrection(selectedFact.id, true, source)} /></TabPanel>
            <TabPanel px="0"><AnnotationList fact={selectedFact} claimId={claim.id} /></TabPanel>
            <TabPanel px="0"><SourceTimeline fact={selectedFact} corrections={claimCorrections.filter((item) => item.factId === selectedFact.id)} /></TabPanel>
          </TabPanels>
        </Tabs>
      </Box>}
    </Grid>
    <Modal isOpen={sourceModal.isOpen} onClose={sourceModal.onClose} size="xl"><ModalOverlay /><ModalContent><ModalHeader>{counterSource ? '关联相反证据' : '关联支持证据'}</ModalHeader><ModalCloseButton /><ModalBody><Grid templateColumns="1fr 1fr" gap="3"><FormControl><FormLabel>来源标题</FormLabel><Input value={sourceForm.title} onChange={(event) => setSourceForm({ ...sourceForm, title: event.target.value })} /></FormControl><FormControl><FormLabel>公开地址</FormLabel><Input value={sourceForm.url} onChange={(event) => setSourceForm({ ...sourceForm, url: event.target.value })} /></FormControl><FormControl><FormLabel>发布机构</FormLabel><Input value={sourceForm.publisher} onChange={(event) => setSourceForm({ ...sourceForm, publisher: event.target.value })} /></FormControl><FormControl><FormLabel>证据类型</FormLabel><Select value={sourceForm.kind} onChange={(event) => setSourceForm({ ...sourceForm, kind: event.target.value as EvidenceKind })}>{['原始证据', '二次来源', '待证信息'].map((value) => <option key={value}>{value}</option>)}</Select></FormControl><FormControl><FormLabel>内容哈希</FormLabel><Input placeholder="sha256:..." value={sourceForm.contentHash} onChange={(event) => setSourceForm({ ...sourceForm, contentHash: event.target.value })} /></FormControl><FormControl><FormLabel>留档说明</FormLabel><Input value={sourceForm.chainOfCustody} onChange={(event) => setSourceForm({ ...sourceForm, chainOfCustody: event.target.value })} /></FormControl></Grid></ModalBody><ModalFooter><Button variant="ghost" mr="3" onClick={sourceModal.onClose}>取消</Button><Button colorScheme="teal" isDisabled={!sourceForm.title || !sourceForm.url} onClick={addSource}>加入证据关系图</Button></ModalFooter></ModalContent></Modal>
    <Modal isOpen={versionModal.isOpen} onClose={versionModal.onClose} size="xl"><ModalOverlay /><ModalContent><ModalHeader>状态流转与版本说明</ModalHeader><ModalCloseButton /><ModalBody><FormControl mb="4"><FormLabel>版本变更说明</FormLabel><Textarea rows={3} value={transitionNote} onChange={(event) => setTransitionNote(event.target.value)} /></FormControl><Text fontSize="xs" color="gray.500" mb="3">待编辑复核需要至少一项事实；发布时会拦截证据不足且存在疑点的事实。首次发布将冻结完整发布档案，之后的来源更正只追加版本，不改写档案。</Text>
      <Divider mb="3" /><Text fontWeight="700" fontSize="sm" mb="2">版本记录（{claimVersions.length}）</Text>
      <Box maxH="300px" overflowY="auto">{claimVersions.sort((a, b) => b.version - a.version).map((version) => {
        const correction = version.correctionId ? claimCorrections.find((item) => item.id === version.correctionId) : undefined
        const oldSource = version.oldSourceId ? findSourceInClaim(claim, version.oldSourceId) : undefined
        return <Box key={version.id} borderWidth="1px" p="3" mb="2" bg={version.type === '来源更正' ? 'purple.50' : 'white'}>
          <Flex align="center"><Badge colorScheme={version.type === '来源更正' ? 'purple' : 'teal'}>V{version.version} · {version.type === '来源更正' ? '来源更正' : '状态流转'}</Badge><Text fontSize="xs" color="gray.500" ml="2">{version.createdAt.replace('T', ' ').slice(0, 16)} · {version.editor}</Text></Flex>
          <Text fontSize="sm" mt="2">{version.summary}</Text>
          {correction && oldSource && <Box mt="3"><Text fontSize="xs" color="gray.500" mb="1">两次来源差异 · 确认人 {correction.reviewedBy}</Text><SourceDiffTable oldSource={oldSource} newSource={correction.newSource} /></Box>}
        </Box>
      })}</Box>
    </ModalBody><ModalFooter><Button mr="2" onClick={() => transition('待编辑复核')}>提交编辑复核</Button><Button colorScheme="teal" onClick={() => transition('已发布')}>发布正式版本</Button></ModalFooter></ModalContent></Modal>
    <Modal isOpen={archiveModal.isOpen} onClose={archiveModal.onClose} size="4xl"><ModalOverlay /><ModalContent><ModalHeader>已发布档案（不可变留档）</ModalHeader><ModalCloseButton /><ModalBody>{snapshot && <PublishedArchive snapshot={snapshot} corrections={claimCorrections.filter((item) => item.status === '已确认')} />}</ModalBody><ModalFooter><Button colorScheme="teal" onClick={archiveModal.onClose}>关闭</Button></ModalFooter></ModalContent></Modal>
    <Modal isOpen={correctionModal.isOpen} onClose={correctionModal.onClose} size="3xl"><ModalOverlay /><ModalContent><ModalHeader>发起来源更正</ModalHeader><ModalCloseButton /><ModalBody>
      {correctionTarget && <CorrectionForm claim={claim} factId={correctionTarget.factId} counter={correctionTarget.counter} oldSourceId={correctionTarget.oldSourceId} reason={correctionReason} setReason={setCorrectionReason} form={correctionForm} setForm={setCorrectionForm} />}
    </ModalBody><ModalFooter><Button variant="ghost" mr="3" onClick={correctionModal.onClose}>取消</Button><Button colorScheme="purple" isDisabled={!correctionReason.trim() || !correctionForm.title || !correctionForm.url} onClick={submitCorrection}>提交更正申请（待编辑确认）</Button></ModalFooter></ModalContent></Modal>
  </Box>
}

function tabLabel(label: string, sources: SourceRecord[]) {
  const active = sources.filter(isActiveSource).length
  const history = sources.length - active
  return `${label} ${active}${history > 0 ? ` · 历史${history}` : ''}`
}

function CorrectionForm({ claim, factId, counter, oldSourceId, reason, setReason, form, setForm }: { claim: { reporter: string }; factId: string; counter: boolean; oldSourceId: string; reason: string; setReason: (v: string) => void; form: Omit<SourceRecord, 'id' | 'capturedAt' | 'version'>; setForm: (v: Omit<SourceRecord, 'id' | 'capturedAt' | 'version'>) => void }) {
  // 由上层 ClaimWorkspace 传入 claim 仅用于显示记者；旧来源在 EvidenceList 已可见，这里通过 store 读取
  const fullClaim = useClaimStore((state) => state.claims.find((item) => item.facts.some((fact) => fact.id === factId)))
  const fact = fullClaim?.facts.find((item) => item.id === factId)
  const oldSource = fact ? [...counter ? fact.counterSources : fact.sources].find((item) => item.id === oldSourceId) : undefined
  return <Grid templateColumns="1fr 1fr" gap="4">
    <Box gridColumn="1 / -1" bg="amber.50" borderWidth="1px" borderColor="orange.200" p="3"><Text fontSize="xs" color="orange.700">编辑确认前，报告继续显示下方原来源，并提示“待更正”；新材料仅暂存，确认后才成为当前依据。</Text></Box>
    <FormInfo label="要更正的原来源"><Box borderWidth="1px" p="2" bg="gray.50"><Text fontWeight="600" fontSize="sm">{oldSource?.title}</Text><Text fontSize="xs" color="gray.600" mt="1">{oldSource?.publisher} · {oldSource?.publishedAt} · {oldSource?.contentHash}</Text></Box></FormInfo>
    <FormInfo label="更正申请人"><Text fontSize="sm">{claim.reporter}（记者）</Text></FormInfo>
    <FormControl gridColumn="1 / -1"><FormLabel fontSize="sm">更正原因（必填，读者可见）</FormLabel><Textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="说明原来源存在什么问题、新材料为何可作为更正依据" /></FormControl>
    <FormControl><FormLabel fontSize="sm">新材料标题</FormLabel><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></FormControl>
    <FormControl><FormLabel fontSize="sm">公开地址</FormLabel><Input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} /></FormControl>
    <FormControl><FormLabel fontSize="sm">发布机构</FormLabel><Input value={form.publisher} onChange={(event) => setForm({ ...form, publisher: event.target.value })} /></FormControl>
    <FormControl><FormLabel fontSize="sm">发布日期</FormLabel><Input type="date" value={form.publishedAt} onChange={(event) => setForm({ ...form, publishedAt: event.target.value })} /></FormControl>
    <FormControl><FormLabel fontSize="sm">证据类型</FormLabel><Select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as EvidenceKind })}>{['原始证据', '二次来源', '待证信息'].map((value) => <option key={value}>{value}</option>)}</Select></FormControl>
    <FormControl><FormLabel fontSize="sm">内容哈希</FormLabel><Input placeholder="sha256:..." value={form.contentHash} onChange={(event) => setForm({ ...form, contentHash: event.target.value })} /></FormControl>
    <FormControl gridColumn="1 / -1"><FormLabel fontSize="sm">新材料留档说明</FormLabel><Input value={form.chainOfCustody} onChange={(event) => setForm({ ...form, chainOfCustody: event.target.value })} /></FormControl>
  </Grid>
}

function FormInfo({ label, children }: { label: string; children: ReactNode }) {
  return <Box><FormLabel fontSize="sm">{label}</FormLabel>{children}</Box>
}

function PendingCorrectionNotice({ fact, corrections }: { fact: ClaimFact; corrections: SourceCorrection[] }) {
  const pending = corrections.filter((item) => item.status === '待编辑确认')
  if (!pending.length) return null
  return <Box mt="3" bg="orange.50" borderWidth="1px" borderColor="orange.300" p="3">
    <Flex align="center" gap="2"><Badge colorScheme="orange">来源待更正</Badge><Text fontSize="xs" color="orange.800">编辑确认前，报告继续显示原来源；以下更正申请不改变当前事实依据</Text></Flex>
    {pending.map((item) => {
      const old = [...fact.sources, ...fact.counterSources].find((source) => source.id === item.oldSourceId)
      return <Box key={item.id} mt="2" p="2" bg="white" borderWidth="1px">
        <Text fontSize="xs" color="gray.500">{item.id} · {item.requestedBy} 发起于 {item.requestedAt.replace('T', ' ').slice(0, 16)}</Text>
        <Text fontSize="sm" mt="1">原来源：<b>{old?.title ?? item.oldSourceId}</b></Text>
        <Text fontSize="sm">新材料：<b>{item.newSource.title}</b>（{item.newSource.publisher} · {item.newSource.publishedAt}）</Text>
        <Text fontSize="xs" color="gray.600" mt="1">更正原因：{item.reason}</Text>
      </Box>
    })}
  </Box>
}

function EvidenceList({ sources, factId, corrections, onAdd, onCorrect, counter = false }: { sources: SourceRecord[]; factId: string; corrections: SourceCorrection[]; onAdd: () => void; onCorrect: (source: SourceRecord) => void; counter?: boolean }) {
  const active = sources.filter(isActiveSource)
  const history = sources.filter((source) => !isActiveSource(source))
  return <Box><Flex justify="space-between" mb="3"><Text fontSize="sm" color="gray.600">{counter ? '相反证据与支持证据并列保留' : '当前依据与被更正历史分开显示'}</Text><Button size="sm" colorScheme={counter ? 'red' : 'teal'} variant="outline" onClick={onAdd}>{counter ? '关联相反证据' : '关联支持证据'}</Button></Flex>
    {active.map((source) => {
      const pending = corrections.find((item) => item.factId === factId && item.oldSourceId === source.id && item.status === '待编辑确认')
      return <SourceCard key={source.id} source={source} pending={pending} onCorrect={() => onCorrect(source)} />
    })}
    {history.length > 0 && <Box mt="3"><Text fontSize="xs" color="gray.500" mb="2">已更正来源（保留留档，不再作为当前依据）</Text>{history.map((source) => {
      const confirmed = corrections.find((item) => item.newSource.id === source.supersededBy && item.status === '已确认')
      return <SourceCard key={source.id} source={source} confirmed={confirmed} />
    })}</Box>}
  </Box>
}

function SourceCard({ source, pending, confirmed, onCorrect }: { source: SourceRecord; pending?: SourceCorrection; confirmed?: SourceCorrection; onCorrect?: () => void }) {
  const [showDiff, setShowDiff] = useState(false)
  const superseded = !!source.supersededBy
  return <Box borderWidth="1px" p="3" mb="2" bg={superseded ? 'gray.50' : pending ? 'orange.50' : 'white'} borderColor={pending ? 'orange.300' : superseded ? 'gray.300' : 'gray.200'} opacity={superseded ? 0.85 : 1}>
    <Flex justify="space-between" align="flex-start"><Text fontWeight="600" fontSize="sm">{source.title}</Text><Flex align="center" gap={1}>
      <Badge colorScheme={source.kind === '原始证据' ? 'green' : source.kind === '二次来源' ? 'orange' : 'gray'}>{source.kind}</Badge>
      {superseded ? <Badge colorScheme="gray">已更正 · 留档</Badge> : <Badge colorScheme="teal">当前依据</Badge>}
      {pending && <Badge colorScheme="orange">待更正</Badge>}
    </Flex></Flex>
    <Text fontSize="xs" color="gray.600" mt="2">{source.publisher} · {source.publishedAt} · V{source.version}</Text>
    <Text fontFamily="mono" fontSize="xs" mt="2">{source.contentHash}</Text>
    <Divider my="2" /><Text fontSize="xs">{source.chainOfCustody}</Text>
    <Text fontSize="xs" color="blue.600" mt="1" wordBreak="break-all">{source.url}</Text>
    {pending && <Box mt="2" p="2" bg="white" borderWidth="1px"><Text fontSize="xs" color="orange.700">待编辑确认：{pending.requestedBy} 已关联新材料《{pending.newSource.title}》并填写更正原因；确认前此处继续显示原来源。</Text></Box>}
    {confirmed && <Box mt="2" p="2" bg="purple.50" borderWidth="1px" borderColor="purple.200"><Text fontSize="xs" color="purple.800">经 {confirmed.reviewedBy} 于 {confirmed.reviewedAt?.replace('T', ' ').slice(0, 16)} 确认更正为《{confirmed.newSource.title}》。</Text><Button size="xs" variant="link" colorScheme="purple" mt="1" onClick={() => setShowDiff((v) => !v)}>{showDiff ? '收起两次来源差异' : '查看两次来源差异'}</Button><Collapse in={showDiff} animateOpacity={false}><Box mt="2"><SourceDiffTable oldSource={source} newSource={confirmed.newSource} /></Box></Collapse></Box>}
    {!superseded && !pending && onCorrect && <Flex mt="2" justify="flex-end"><Button size="xs" variant="outline" colorScheme="purple" onClick={onCorrect}>发起来源更正</Button></Flex>}
  </Box>
}

function SourceTimeline({ fact, corrections }: { fact: ClaimFact; corrections: SourceCorrection[] }) {
  type Event = { at: string; node: ReactNode; key: string }
  const events: Event[] = []
  for (const source of [...fact.sources, ...fact.counterSources]) {
    events.push({ at: source.capturedAt, key: `source-${source.id}`, node: <Box><Text fontSize="xs" color="gray.500">{source.publishedAt} 发布 · {source.kind} · 留档于 {source.capturedAt.replace('T', ' ').slice(0, 16)}</Text><Text fontWeight="600" mt="1" fontSize="sm">{source.title}{source.supersededBy && <Badge ml="2" colorScheme="gray">已更正留档</Badge>}</Text><Text fontSize="sm" color="gray.600">{source.publisher}</Text></Box> })
  }
  for (const item of corrections) {
    events.push({ at: item.requestedAt, key: `request-${item.id}`, node: <Box bg="orange.50" p="2" borderWidth="1px" borderColor="orange.200"><Text fontSize="xs" color="orange.700">{item.id} · {item.requestedBy} 发起来源更正</Text><Text fontSize="sm" mt="1">申请更正《{[...fact.sources, ...fact.counterSources].find((s) => s.id === item.oldSourceId)?.title ?? item.oldSourceId}》→《{item.newSource.title}》</Text></Box> })
    if (item.reviewedAt) events.push({ at: item.reviewedAt, key: `review-${item.id}`, node: <Box bg={item.status === '已确认' ? 'purple.50' : 'red.50'} p="2" borderWidth="1px" borderColor={item.status === '已确认' ? 'purple.200' : 'red.200'}><Text fontSize="xs" color={item.status === '已确认' ? 'purple.700' : 'red.700'}>{item.reviewedAt.replace('T', ' ').slice(0, 16)} · {item.status === '已确认' ? '编辑确认来源更正，生成更正版本' : '编辑驳回更正'} · 确认人 {item.reviewedBy}</Text><Text fontSize="sm" mt="1">{item.reviewNote}</Text></Box> })
  }
  return <Box borderLeftWidth="2px" borderColor="gray.300" pl="4">{events.sort((a, b) => a.at.localeCompare(b.at)).map((event) => <Box key={event.key} mb="4">{event.node}</Box>)}</Box>
}

function PublishedArchive({ snapshot, corrections }: { snapshot: PublishedSnapshot; corrections: SourceCorrection[] }) {
  const later = corrections.filter((item) => item.requestedAt >= snapshot.publishedAt)
  return <Box>
    <Flex justify="space-between" bg="purple.50" borderWidth="1px" borderColor="purple.200" p="3"><Box><Text fontWeight="700" fontSize="sm">{snapshot.claim.title}</Text><Text fontSize="xs" color="gray.600" mt="1">冻结于 {snapshot.publishedAt.replace('T', ' ').slice(0, 16)} · 发布编辑 {snapshot.editor} · 版本 V{snapshot.version}</Text></Box><Badge colorScheme="purple">发布后不改写</Badge></Flex>
    <Text fontWeight="700" fontSize="sm" mt="4" mb="2">发布档案中的事实与来源</Text>
    {snapshot.claim.facts.map((fact) => <Box key={fact.id} borderWidth="1px" p="3" mb="2"><Text fontSize="xs" color="gray.500">{fact.id} · <Badge colorScheme={conclusionColor[fact.conclusion]}>{fact.conclusion}</Badge> · 置信度 {fact.confidence}%</Text><Text fontSize="sm" fontWeight="600" mt="1">{fact.text}</Text>{[...fact.sources, ...fact.counterSources].map((source) => <Text key={source.id} fontSize="xs" color="gray.700" mt="1">· {source.title}（{source.publisher} · {source.publishedAt} · {source.contentHash}）</Text>)}</Box>)}
    <Divider my="4" />
    <Text fontWeight="700" fontSize="sm" mb="2">发布后的来源更正（仅追加，不改写上方档案）</Text>
    {later.length === 0 && <Text fontSize="sm" color="gray.500">暂无。</Text>}
    {later.map((item) => {
      const oldSnapshot = snapshot.claim.facts.flatMap((fact) => [...fact.sources, ...fact.counterSources]).find((source) => source.id === item.oldSourceId)
      return <Box key={item.id} borderWidth="1px" borderColor="purple.200" p="3" mb="3" bg="purple.50">
        <Flex justify="space-between"><Text fontSize="sm" fontWeight="600">{item.id} · 事实 {item.factId}</Text><Badge colorScheme="purple">已确认 · 确认人 {item.reviewedBy}</Badge></Flex>
        <Text fontSize="xs" color="gray.600" mt="1">确认时间 {item.reviewedAt?.replace('T', ' ').slice(0, 16)} · 记者 {item.requestedBy}</Text>
        <Text fontSize="sm" mt="1">更正原因：{item.reason}</Text>
        {oldSnapshot && <Box mt="2"><Text fontSize="xs" color="gray.500" mb="1">发布档案来源 vs 当前来源</Text><SourceDiffTable oldSource={oldSnapshot} newSource={item.newSource} /></Box>}
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

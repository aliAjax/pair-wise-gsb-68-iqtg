import { Badge, Box, Flex, Grid, GridItem, Text } from '@chakra-ui/react'
import type { SourceCorrection, SourceRecord } from '../types'

export function SourceMiniCard({ source, tone }: { source: SourceRecord; tone: 'old' | 'new' }) {
  const palette = tone === 'old' ? { border: 'orange.300', bg: 'orange.50', tag: '旧来源' } : { border: 'green.300', bg: 'green.50', tag: '新材料' }
  return <Box borderWidth="1px" borderColor={palette.border} bg={palette.bg} p="2.5" h="100%">
    <Flex justify="space-between" align="center" mb="1"><Badge colorScheme={tone === 'old' ? 'orange' : 'green'}>{palette.tag}</Badge><Text fontSize="xs" color="gray.500">{source.kind} · V{source.version}</Text></Flex>
    <Text fontWeight="600" fontSize="sm">{source.title}</Text>
    <Text fontSize="xs" color="gray.600" mt="1">{source.publisher} · {source.publishedAt}</Text>
    <Text fontSize="xs" color="gray.600" mt="0.5">留档 {source.capturedAt.replace('T', ' ').slice(0, 16)}</Text>
    <Text fontFamily="mono" fontSize="xs" mt="1">{source.contentHash}</Text>
    <Text fontSize="xs" color="blue.600" mt="1" wordBreak="break-all">{source.url}</Text>
    <Text fontSize="xs" color="gray.600" mt="1">{source.chainOfCustody}</Text>
  </Box>
}

export function GridDiff({ children }: { children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children]
  return <Grid templateColumns="1fr 1fr" gap="2" mt="2">
    {items.map((child, index) => <GridItem key={index}>{child}</GridItem>)}
  </Grid>
}

/** 更正单全景：状态、原因、两次来源差异、申请人/确认人 */
export function CorrectionDiff({ correction, oldSource }: { correction: SourceCorrection; oldSource?: SourceRecord }) {
  const statusColor = correction.status === '已确认' ? 'green' : correction.status === '待编辑确认' ? 'orange' : 'red'
  return <Box borderWidth="1px" p="3" mb="2">
    <Flex justify="space-between" align="center" mb="2">
      <Text fontSize="xs" fontFamily="mono" color="gray.500">{correction.id}{correction.counter ? ' · 相反证据' : ''}</Text>
      <Badge colorScheme={statusColor}>{correction.status}</Badge>
    </Flex>
    <Text fontSize="sm" mt="1">更正原因：{correction.reason}</Text>
    <GridDiff>
      {oldSource
        ? <SourceMiniCard source={oldSource} tone="old" />
        : <Box borderWidth="1px" borderStyle="dashed" borderColor="orange.300" p="2.5"><Badge colorScheme="orange">旧来源</Badge><Text fontSize="xs" color="gray.500" mt="2">原来源 {correction.oldSourceId} 已不在当前列表，可在发布版本快照中查看原内容</Text></Box>}
      <SourceMiniCard source={correction.newSource} tone="new" />
    </GridDiff>
    <Flex fontSize="xs" color="gray.500" mt="2" gap="4" wrap="wrap">
      <Text>申请人 {correction.requestedBy} · {correction.requestedAt.replace('T', ' ').slice(0, 16)}</Text>
      {correction.confirmedBy && <Text color="green.700">确认人 {correction.confirmedBy} · {correction.confirmedAt?.replace('T', ' ').slice(0, 16)}</Text>}
      {correction.rejectedBy && <Text color="red.700">驳回人 {correction.rejectedBy} · {correction.rejectedAt?.replace('T', ' ').slice(0, 16)}：{correction.rejectReason}</Text>}
    </Flex>
  </Box>
}

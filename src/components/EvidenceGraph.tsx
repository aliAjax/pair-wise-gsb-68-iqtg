import { Badge, Box, Flex, Text } from '@chakra-ui/react'
import { isActiveSource } from '../utils/source'
import type { ClaimFact, SourceCorrection } from '../types'

export function EvidenceGraph({ facts, corrections = [] }: { facts: ClaimFact[]; corrections?: SourceCorrection[] }) {
  return <Box borderWidth="1px" bg="white" p="4">
    <Flex justify="space-between" mb="3"><Text fontWeight="700">主张与证据关系</Text><Text fontSize="xs" color="gray.600">实线支持 / 虚线反驳 / 待更正来源确认前仍计入当前依据</Text></Flex>
    <Flex overflowX="auto" gap="3" minH="150px" align="stretch">
      <Box minW="150px" bg="teal.700" color="white" p="3" borderRadius="4px"><Text fontSize="xs">核查主张</Text><Text fontWeight="700" mt="2">待发布报告</Text></Box>
      {facts.map((fact) => {
        const pending = corrections.filter((item) => item.factId === fact.id && item.status === '待编辑确认')
        return <Box key={fact.id} minW="220px" borderWidth="1px" borderColor={pending.length ? 'orange.400' : 'gray.300'} p="3" position="relative" _before={{ content: '"—"', position: 'absolute', left: '-12px', color: 'teal.600' }}>
          {pending.length > 0 && <Badge position="absolute" top="2" right="2" colorScheme="orange">来源待更正</Badge>}
          <Text fontSize="xs" color="gray.500">事实 {fact.id}</Text>
          <Text fontSize="sm" fontWeight="700" mt="1">{fact.text}</Text>
          <Flex mt="3" gap="2"><Box flex="1" borderWidth="1px" borderColor="green.300" p="2"><Text fontSize="xs">支持 {fact.sources.filter(isActiveSource).length}</Text></Box><Box flex="1" borderWidth="1px" borderColor="red.300" borderStyle="dashed" p="2"><Text fontSize="xs">反驳 {fact.counterSources.filter(isActiveSource).length}</Text></Box></Flex>
          {pending.length > 0 && <Text fontSize="xs" color="orange.700" mt="2">{pending.length} 条更正待编辑确认，报告仍显示原来源</Text>}
        </Box>
      })}
    </Flex>
  </Box>
}

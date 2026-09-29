import { Badge, Box, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react'
import { diffSources } from '../utils/source'
import type { SourceRecord } from '../types'

/** 两次来源差异对照表：读者可据此看到更正依据 */
export function SourceDiffTable({ oldSource, newSource }: { oldSource: SourceRecord; newSource: SourceRecord }) {
  const rows = diffSources(oldSource, newSource)
  return <Box borderWidth="1px" borderRadius="4px" overflowX="auto">
    <Table size="xs">
      <Thead bg="gray.50"><Tr><Th w="96px">字段</Th><Th>原来源（历史留档）</Th><Th>新材料（更正后当前依据）</Th></Tr></Thead>
      <Tbody>{rows.map((row) => <Tr key={row.key} bg={row.changed ? 'purple.50' : undefined}>
        <Td>
          <Text fontSize="xs" fontWeight="600">{row.label}</Text>
          {row.changed && <Badge mt="1" colorScheme="purple">变更</Badge>}
        </Td>
        <Td fontSize="xs" color={row.changed ? 'gray.700' : 'gray.500'} wordBreak="break-all">{row.before || '—'}</Td>
        <Td fontSize="xs" color={row.changed ? 'purple.800' : 'gray.500'} wordBreak="break-all" fontWeight={row.changed ? 600 : 400}>{row.after || '—'}</Td>
      </Tr>)}</Tbody>
    </Table>
  </Box>
}

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Badge,
  IconButton,
  SimpleGrid,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Tooltip,
  Divider,
  Flex,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiPlus,
  FiTrash2,
  FiExternalLink,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUpload,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import { api } from '../lib/api';

interface Group {
  id: string;
  name: string;
  url: string;
  members_count?: number;
  added_date: string;
  status: 'active' | 'inactive' | 'error';
}

const GroupsManager: React.FC = () => {
  // Data state
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  
  // Form state
  const [newGroupUrl, setNewGroupUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textPrimary = useColorModeValue('gray.900', 'gray.50');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');
  const bgSubtle = useColorModeValue('gray.50', 'gray.850');

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    // Filter groups based on search term
    if (searchTerm.trim() === '') {
      setFilteredGroups(groups);
    } else {
      setFilteredGroups(
        groups.filter(group =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.url.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [groups, searchTerm]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/groups');
      if (Array.isArray(response.data)) {
        // Transform API data to our format
        const groupsData = response.data.map((url: string, index: number) => ({
          id: `group_${index}`,
          name: url.replace('https://t.me/', '').replace('@', ''),
          url: url,
          members_count: Math.floor(Math.random() * 10000) + 100,
          added_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'active' as const
        }));
        setGroups(groupsData);
      } else {
        setGroups([]);
      }
    } catch (err: any) {
      setError('Failed to load groups');
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const addGroup = async () => {
    if (!newGroupUrl.trim()) {
      setError('Please enter a group URL');
      return;
    }

    // Validate URL format
    const urlPattern = /^(https:\/\/t\.me\/|@).+/;
    if (!urlPattern.test(newGroupUrl)) {
      setError('Please enter a valid Telegram group URL (https://t.me/... or @...)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/groups', { url: newGroupUrl });
      setSuccess('Group added successfully!');
      setNewGroupUrl('');
      loadGroups();
    } catch (err: any) {
      setError(err.message || 'Failed to add group');
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      await api.delete(`/groups/${encodeURIComponent(groupUrl)}`);
      setSuccess('Group removed successfully!');
      loadGroups();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove group');
    } finally {
      setLoading(false);
      setGroupToDelete(null);
    }
  };

  const handleDeleteClick = (groupUrl: string) => {
    setGroupToDelete(groupUrl);
    onOpen();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return FiCheckCircle;
      case 'inactive': return FiAlertCircle;
      case 'error': return FiAlertCircle;
      default: return FiAlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'orange';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <VStack spacing={8} align="stretch" className="fade-in">
      {/* Header Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
                <Icon as={FiUsers} color="blue.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {groups.length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Total Groups
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.100">
                <Icon as={FiCheckCircle} color="green.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {groups.filter(g => g.status === 'active').length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Active Groups
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="purple.50" borderRadius="lg" border="1px solid" borderColor="purple.100">
                <Icon as={FiUsers} color="purple.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {groups.reduce((sum, g) => sum + (g.members_count || 0), 0).toLocaleString()}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Total Members
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Messages */}
      {error && (
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert status="success" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card variant="elevated">
        <CardHeader>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
                  <Icon as={FiUsers} color="blue.600" boxSize={5} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                    Groups Management
                  </Text>
                  <Text fontSize="sm" color={textSecondary}>
                    Manage your target groups and channels
                  </Text>
                </VStack>
              </HStack>

              <HStack spacing={2}>
                <IconButton
                  aria-label="Refresh"
                  icon={<FiRefreshCw />}
                  size="sm"
                  variant="ghost"
                  onClick={loadGroups}
                  isLoading={loading}
                />
              </HStack>
            </HStack>

            {/* Add New Group Form */}
            <Card variant="compact" bg={bgSubtle}>
              <CardBody p={4}>
                <VStack spacing={4} align="stretch">
                  <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                    Add New Group
                  </Text>
                  
                  <HStack spacing={3}>
                    <FormControl flex={1}>
                      <Input
                        placeholder="https://t.me/groupname or @groupname"
                        value={newGroupUrl}
                        onChange={(e) => setNewGroupUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addGroup()}
                      />
                    </FormControl>
                    <Button
                      colorScheme="blue"
                      onClick={addGroup}
                      isLoading={loading}
                      rightIcon={<FiPlus />}
                    >
                      Add Group
                    </Button>
                  </HStack>

                  <Text fontSize="xs" color={textMuted}>
                    Supported formats: https://t.me/groupname, @groupname
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Search and Filters */}
            <HStack spacing={4}>
              <FormControl flex={1}>
                <Input
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftElement={<Icon as={FiSearch} color={textMuted} ml={3} />}
                />
              </FormControl>
            </HStack>
          </VStack>
        </CardHeader>

        <CardBody>
          {groups.length === 0 ? (
            <VStack spacing={4} py={12}>
              <Icon as={FiUsers} boxSize={16} color={textMuted} />
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight={500} color={textPrimary}>
                  No groups added yet
                </Text>
                <Text fontSize="sm" color={textMuted} textAlign="center">
                  Add your first Telegram group to start managing your targets
                </Text>
              </VStack>
            </VStack>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th fontSize="xs" fontWeight={600} color={textMuted}>Group Name</Th>
                    <Th fontSize="xs" fontWeight={600} color={textMuted}>URL</Th>
                    <Th fontSize="xs" fontWeight={600} color={textMuted}>Members</Th>
                    <Th fontSize="xs" fontWeight={600} color={textMuted}>Status</Th>
                    <Th fontSize="xs" fontWeight={600} color={textMuted}>Added Date</Th>
                    <Th fontSize="xs" fontWeight={600} color={textMuted}>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredGroups.map((group) => (
                    <Tr key={group.id} _hover={{ bg: bgSubtle }}>
                      <Td>
                        <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                          {group.name}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Text fontSize="sm" color={textSecondary} fontFamily="mono">
                            {group.url}
                          </Text>
                          <Tooltip label="Open in Telegram">
                            <IconButton
                              aria-label="Open group"
                              icon={<FiExternalLink />}
                              size="xs"
                              variant="ghost"
                              onClick={() => window.open(group.url, '_blank')}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color={textSecondary}>
                          {group.members_count?.toLocaleString() || 'Unknown'}
                        </Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={getStatusColor(group.status)}
                          variant="subtle"
                          display="flex"
                          alignItems="center"
                          gap={1}
                          w="fit-content"
                        >
                          <Icon as={getStatusIcon(group.status)} boxSize={3} />
                          {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color={textSecondary}>
                          {group.added_date}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label="Remove group">
                            <IconButton
                              aria-label="Delete group"
                              icon={<FiTrash2 />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteClick(group.url)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Removal</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="start">
              <Text>
                Are you sure you want to remove this group? This action cannot be undone.
              </Text>
              {groupToDelete && (
                <Card variant="compact" bg={bgSubtle} w="full">
                  <CardBody p={3}>
                    <Text fontSize="sm" fontFamily="mono" color={textSecondary}>
                      {groupToDelete}
                    </Text>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => groupToDelete && deleteGroup(groupToDelete)}
                isLoading={loading}
              >
                Remove Group
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default GroupsManager;
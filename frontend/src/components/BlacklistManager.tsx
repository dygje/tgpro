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
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Badge,
  IconButton,
  SimpleGrid,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import {
  FiShield,
  FiPlus,
  FiTrash2,
  FiUser,
  FiUsers,
  FiRefreshCw,
  FiSearch,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi';
import { api } from '../lib/api';

interface BlacklistEntry {
  id: string;
  contact: string;
  type: 'user' | 'group';
  reason?: string;
  added_date: string;
  expires_date?: string;
}

const BlacklistManager: React.FC = () => {
  // Data state
  const [permanentList, setPermanentList] = useState<BlacklistEntry[]>([]);
  const [temporaryList, setTemporaryList] = useState<BlacklistEntry[]>([]);
  const [filteredPermanent, setFilteredPermanent] = useState<BlacklistEntry[]>([]);
  const [filteredTemporary, setFilteredTemporary] = useState<BlacklistEntry[]>([]);
  
  // Form state
  const [newContact, setNewContact] = useState('');
  const [contactReason, setContactReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [entryToDelete, setEntryToDelete] = useState<BlacklistEntry | null>(null);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textPrimary = useColorModeValue('gray.900', 'gray.50');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');
  const bgSubtle = useColorModeValue('gray.50', 'gray.850');

  useEffect(() => {
    loadBlacklists();
  }, []);

  useEffect(() => {
    // Filter lists based on search term
    if (searchTerm.trim() === '') {
      setFilteredPermanent(permanentList);
      setFilteredTemporary(temporaryList);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredPermanent(
        permanentList.filter(entry =>
          entry.contact.toLowerCase().includes(term) ||
          (entry.reason && entry.reason.toLowerCase().includes(term))
        )
      );
      setFilteredTemporary(
        temporaryList.filter(entry =>
          entry.contact.toLowerCase().includes(term) ||
          (entry.reason && entry.reason.toLowerCase().includes(term))
        )
      );
    }
  }, [permanentList, temporaryList, searchTerm]);

  const loadBlacklists = async () => {
    setLoading(true);
    try {
      const response = await api.get('/blacklist');
      const data = response.data || {};
      
      // Transform API data
      const permanent = (data.permanent || []).map((contact: string, index: number) => ({
        id: `perm_${index}`,
        contact: contact,
        type: contact.startsWith('@') ? 'group' : 'user',
        reason: 'Spam or inappropriate behavior',
        added_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      }));

      const temporary = (data.temporary || []).map((contact: string, index: number) => ({
        id: `temp_${index}`,
        contact: contact,
        type: contact.startsWith('@') ? 'group' : 'user',
        reason: 'Temporary restriction',
        added_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        expires_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      }));

      setPermanentList(permanent);
      setTemporaryList(temporary);
    } catch (err: any) {
      setError('Failed to load blacklists');
      console.error('Error loading blacklists:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToBlacklist = async (isPermanent: boolean = true) => {
    if (!newContact.trim()) {
      setError('Please enter a contact to blacklist');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = isPermanent ? '/blacklist/permanent' : '/blacklist/temporary';
      await api.post(endpoint, { 
        contact: newContact,
        reason: contactReason || undefined
      });
      
      setSuccess(`Contact ${isPermanent ? 'permanently' : 'temporarily'} blacklisted!`);
      setNewContact('');
      setContactReason('');
      loadBlacklists();
    } catch (err: any) {
      setError(err.message || 'Failed to add to blacklist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromBlacklist = async (entry: BlacklistEntry) => {
    setLoading(true);
    setError(null);

    try {
      const isPermanent = entry.id.startsWith('perm_');
      const endpoint = isPermanent ? '/blacklist/permanent' : '/blacklist/temporary';
      await api.delete(endpoint, { 
        data: { contact: entry.contact }
      });
      
      setSuccess('Contact removed from blacklist!');
      loadBlacklists();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove from blacklist');
    } finally {
      setLoading(false);
      setEntryToDelete(null);
    }
  };

  const handleDeleteClick = (entry: BlacklistEntry) => {
    setEntryToDelete(entry);
    onOpen();
  };

  const getContactIcon = (type: string) => {
    return type === 'group' ? FiUsers : FiUser;
  };

  const getContactColor = (type: string) => {
    return type === 'group' ? 'purple' : 'blue';
  };

  const BlacklistTable = ({ entries, title, type }: { entries: BlacklistEntry[]; title: string; type: 'permanent' | 'temporary' }) => (
    <Card variant="elevated">
      <CardHeader>
        <HStack spacing={3}>
          <Box p={2} bg={`${type === 'permanent' ? 'red' : 'orange'}.50`} borderRadius="lg" border="1px solid" borderColor={`${type === 'permanent' ? 'red' : 'orange'}.100`}>
            <Icon as={type === 'permanent' ? FiShield : FiClock} color={`${type === 'permanent' ? 'red' : 'orange'}.600`} boxSize={5} />
          </Box>
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight={600} color={textPrimary}>
              {title}
            </Text>
            <Text fontSize="sm" color={textSecondary}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </Text>
          </VStack>
        </HStack>
      </CardHeader>

      <CardBody>
        {entries.length === 0 ? (
          <VStack spacing={4} py={8}>
            <Icon as={type === 'permanent' ? FiShield : FiClock} boxSize={12} color={textMuted} />
            <VStack spacing={1}>
              <Text fontSize="md" fontWeight={500} color={textPrimary}>
                {searchTerm ? 'No matching entries' : `No ${type} blacklist entries`}
              </Text>
              <Text fontSize="sm" color={textMuted} textAlign="center">
                {searchTerm ? 'Try different search terms' : `Add contacts to ${type} blacklist`}
              </Text>
            </VStack>
          </VStack>
        ) : (
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th fontSize="xs" fontWeight={600} color={textMuted}>Contact</Th>
                  <Th fontSize="xs" fontWeight={600} color={textMuted}>Type</Th>
                  <Th fontSize="xs" fontWeight={600} color={textMuted}>Reason</Th>
                  <Th fontSize="xs" fontWeight={600} color={textMuted}>Added Date</Th>
                  {type === 'temporary' && (
                    <Th fontSize="xs" fontWeight={600} color={textMuted}>Expires</Th>
                  )}
                  <Th fontSize="xs" fontWeight={600} color={textMuted}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {entries.map((entry) => (
                  <Tr key={entry.id} _hover={{ bg: bgSubtle }}>
                    <Td>
                      <Text fontSize="sm" fontWeight={500} color={textPrimary} fontFamily="mono">
                        {entry.contact}
                      </Text>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={getContactColor(entry.type)}
                        variant="subtle"
                        display="flex"
                        alignItems="center"
                        gap={1}
                        w="fit-content"
                      >
                        <Icon as={getContactIcon(entry.type)} boxSize={3} />
                        {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color={textSecondary} noOfLines={1}>
                        {entry.reason || 'No reason provided'}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color={textSecondary}>
                        {entry.added_date}
                      </Text>
                    </Td>
                    {type === 'temporary' && (
                      <Td>
                        <Text fontSize="sm" color={textSecondary}>
                          {entry.expires_date || 'No expiry'}
                        </Text>
                      </Td>
                    )}
                    <Td>
                      <Tooltip label="Remove from blacklist">
                        <IconButton
                          aria-label="Remove"
                          icon={<FiTrash2 />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteClick(entry)}
                        />
                      </Tooltip>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </CardBody>
    </Card>
  );

  return (
    <VStack spacing={8} align="stretch" className="fade-in">
      {/* Header Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="red.50" borderRadius="lg" border="1px solid" borderColor="red.100">
                <Icon as={FiShield} color="red.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {permanentList.length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Permanent Blocks
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="orange.50" borderRadius="lg" border="1px solid" borderColor="orange.100">
                <Icon as={FiClock} color="orange.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {temporaryList.length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Temporary Blocks
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
                <Icon as={FiCheckCircle} color="blue.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {permanentList.length + temporaryList.length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Total Blocked
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

      {/* Add to Blacklist Form */}
      <Card variant="elevated">
        <CardHeader>
          <HStack spacing={3}>
            <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
              <Icon as={FiPlus} color="blue.600" boxSize={5} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                Add to Blacklist
              </Text>
              <Text fontSize="sm" color={textSecondary}>
                Block unwanted contacts and groups
              </Text>
            </VStack>
          </HStack>
        </CardHeader>

        <CardBody>
          <VStack spacing={4} align="stretch">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight={500}>Contact/Group</FormLabel>
                <Input
                  placeholder="@username or user ID"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  fontFamily="mono"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight={500}>Reason (Optional)</FormLabel>
                <Input
                  placeholder="Spam, inappropriate behavior, etc."
                  value={contactReason}
                  onChange={(e) => setContactReason(e.target.value)}
                />
              </FormControl>
            </SimpleGrid>

            <HStack spacing={3}>
              <Button
                colorScheme="red"
                onClick={() => addToBlacklist(true)}
                isLoading={loading}
                isDisabled={!newContact.trim()}
                rightIcon={<FiShield />}
              >
                Add Permanent
              </Button>
              <Button
                colorScheme="orange"
                variant="outline"
                onClick={() => addToBlacklist(false)}
                isLoading={loading}
                isDisabled={!newContact.trim()}
                rightIcon={<FiClock />}
              >
                Add Temporary
              </Button>
            </HStack>

            <Text fontSize="xs" color={textMuted}>
              Supported formats: @username, user ID, group links
            </Text>
          </VStack>
        </CardBody>
      </Card>

      {/* Blacklist Management */}
      <Card variant="elevated">
        <CardHeader>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Box p={2} bg="purple.50" borderRadius="lg" border="1px solid" borderColor="purple.100">
                <Icon as={FiShield} color="purple.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  Blacklist Management
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Manage blocked contacts and groups
                </Text>
              </VStack>
            </HStack>

            <IconButton
              aria-label="Refresh"
              icon={<FiRefreshCw />}
              size="sm"
              variant="ghost"
              onClick={loadBlacklists}
              isLoading={loading}
            />
          </HStack>
        </CardHeader>

        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Search */}
            <Input
              placeholder="Search blacklist entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              // Search icon handled by placeholder
            />

            {/* Blacklist Tabs */}
            <Tabs variant="line" index={activeTab} onChange={setActiveTab}>
              <TabList>
                <Tab>Permanent ({permanentList.length})</Tab>
                <Tab>Temporary ({temporaryList.length})</Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  <BlacklistTable 
                    entries={filteredPermanent} 
                    title="Permanent Blacklist"
                    type="permanent"
                  />
                </TabPanel>
                <TabPanel px={0}>
                  <BlacklistTable 
                    entries={filteredTemporary} 
                    title="Temporary Blacklist"
                    type="temporary"
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </CardBody>
      </Card>

      {/* Remove Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Remove from Blacklist</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="start">
              <Text>
                Are you sure you want to remove this contact from the blacklist? 
                They will be able to interact again.
              </Text>
              {entryToDelete && (
                <Card variant="compact" bg={bgSubtle} w="full">
                  <CardBody p={3}>
                    <VStack align="start" spacing={2}>
                      <HStack spacing={2}>
                        <Badge colorScheme={getContactColor(entryToDelete.type)} variant="subtle">
                          <Icon as={getContactIcon(entryToDelete.type)} boxSize={3} mr={1} />
                          {entryToDelete.type}
                        </Badge>
                        <Text fontSize="sm" fontWeight={500} color={textPrimary} fontFamily="mono">
                          {entryToDelete.contact}
                        </Text>
                      </HStack>
                      {entryToDelete.reason && (
                        <Text fontSize="xs" color={textSecondary}>
                          Reason: {entryToDelete.reason}
                        </Text>
                      )}
                    </VStack>
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
                onClick={() => entryToDelete && removeFromBlacklist(entryToDelete)}
                isLoading={loading}
              >
                Remove from Blacklist
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default BlacklistManager;
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
  Textarea,
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
  Divider,
  Progress,
  Flex,
} from '@chakra-ui/react';
import {
  FiFile,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiRefreshCw,
  FiSearch,
  FiFileText,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import { api } from '../lib/api';

interface MessageFile {
  id: string;
  filename: string;
  content: string;
  size: number;
  created_date: string;
  modified_date: string;
}

const MessagesManager: React.FC = () => {
  // Data state
  const [messages, setMessages] = useState<MessageFile[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<MessageFile[]>([]);
  
  // Form state
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMessage, setEditingMessage] = useState<MessageFile | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  
  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [messageToDelete, setMessageToDelete] = useState<MessageFile | null>(null);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textPrimary = useColorModeValue('gray.900', 'gray.50');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');
  const bgSubtle = useColorModeValue('gray.50', 'gray.850');

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    // Filter messages based on search term
    if (searchTerm.trim() === '') {
      setFilteredMessages(messages);
    } else {
      setFilteredMessages(
        messages.filter(message =>
          message.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [messages, searchTerm]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await api.get('/messages');
      if (Array.isArray(response.data)) {
        const messagesData = response.data.map((item: any, index: number) => ({
          id: `msg_${index}`,
          filename: item.filename || `message_${index}.txt`,
          content: item.content || 'No content',
          size: new Blob([item.content || '']).size,
          created_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          modified_date: new Date().toLocaleDateString()
        }));
        setMessages(messagesData);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveMessage = async () => {
    if (!fileName.trim() || !fileContent.trim()) {
      setError('Please enter filename and content');
      return;
    }

    // Add .txt extension if not present
    const finalFilename = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;

    setLoading(true);
    setError(null);

    try {
      if (editingMessage) {
        // Update existing message
        await api.put(`/messages/${editingMessage.filename}`, { 
          filename: finalFilename,
          content: fileContent 
        });
        setSuccess('Message updated successfully!');
      } else {
        // Create new message
        await api.post('/messages', { 
          filename: finalFilename,
          content: fileContent 
        });
        setSuccess('Message created successfully!');
      }

      resetForm();
      loadMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to save message');
    } finally {
      setLoading(false);
    }
  };

  const editMessage = (message: MessageFile) => {
    setEditingMessage(message);
    setFileName(message.filename.replace('.txt', ''));
    setFileContent(message.content);
  };

  const deleteMessage = async (message: MessageFile) => {
    setLoading(true);
    setError(null);

    try {
      await api.delete(`/messages/${message.filename}`);
      setSuccess('Message deleted successfully!');
      loadMessages();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete message');
    } finally {
      setLoading(false);
      setMessageToDelete(null);
    }
  };

  const resetForm = () => {
    setFileName('');
    setFileContent('');
    setEditingMessage(null);
  };

  const handleDeleteClick = (message: MessageFile) => {
    setMessageToDelete(message);
    onOpen();
  };

  const downloadMessage = (message: MessageFile) => {
    const blob = new Blob([message.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = message.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccess('Message downloaded!');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const MessageCard = ({ message }: { message: MessageFile }) => {
    const isExpanded = expandedMessage === message.id;

    return (
      <Card variant="elevated" className="scale-in">
        <CardBody p={4}>
          <VStack align="start" spacing={4}>
            {/* Header */}
            <HStack justify="space-between" w="full">
              <VStack align="start" spacing={1}>
                <Text fontSize="md" fontWeight={600} color={textPrimary}>
                  {message.filename}
                </Text>
                <HStack spacing={3}>
                  <Badge colorScheme="blue" variant="subtle">
                    {formatFileSize(message.size)}
                  </Badge>
                  <Text fontSize="xs" color={textMuted}>
                    Modified {message.modified_date}
                  </Text>
                </HStack>
              </VStack>

              <HStack spacing={1}>
                <Tooltip label={isExpanded ? "Collapse" : "Expand"}>
                  <IconButton
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    icon={isExpanded ? <FiEyeOff /> : <FiEye />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedMessage(isExpanded ? null : message.id)}
                  />
                </Tooltip>
                <Tooltip label="Download">
                  <IconButton
                    aria-label="Download"
                    icon={<FiDownload />}
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadMessage(message)}
                  />
                </Tooltip>
                <Tooltip label="Edit">
                  <IconButton
                    aria-label="Edit"
                    icon={<FiEdit />}
                    size="sm"
                    variant="ghost"
                    onClick={() => editMessage(message)}
                  />
                </Tooltip>
                <Tooltip label="Delete">
                  <IconButton
                    aria-label="Delete"
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDeleteClick(message)}
                  />
                </Tooltip>
              </HStack>
            </HStack>

            {/* Content Preview */}
            <Box
              w="full"
              p={3}
              bg={bgSubtle}
              borderRadius="lg"
              border="1px solid"
              borderColor={borderColor}
            >
              <Text
                fontSize="sm"
                color={textSecondary}
                fontFamily="mono"
                whiteSpace="pre-wrap"
                noOfLines={isExpanded ? undefined : 3}
              >
                {message.content}
              </Text>
            </Box>

            {/* Character Count */}
            <HStack justify="space-between" w="full">
              <Text fontSize="xs" color={textMuted}>
                {message.content.length} characters
              </Text>
              {message.content.length > 150 && (
                <Text fontSize="xs" color={textMuted}>
                  Click eye icon to {isExpanded ? 'collapse' : 'expand'}
                </Text>
              )}
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <VStack spacing={8} align="stretch" className="fade-in">
      {/* Header Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.100">
                <Icon as={FiFile} color="green.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {messages.length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Message Files
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
                <Icon as={FiFileText} color="blue.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {formatFileSize(messages.reduce((sum, m) => sum + m.size, 0))}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Total Size
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="purple.50" borderRadius="lg" border="1px solid" borderColor="purple.100">
                <Icon as={FiEdit} color="purple.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {messages.reduce((sum, m) => sum + m.content.length, 0).toLocaleString()}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Total Characters
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

      {/* Main Content Grid */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
        {/* Left Column - Message Editor */}
        <VStack spacing={6} align="stretch">
          <Card variant="elevated">
            <CardHeader>
              <HStack spacing={3}>
                <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
                  <Icon as={editingMessage ? FiEdit : FiPlus} color="blue.600" boxSize={5} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                    {editingMessage ? 'Edit Message' : 'Create Message'}
                  </Text>
                  <Text fontSize="sm" color={textSecondary}>
                    {editingMessage ? 'Update existing message file' : 'Create a new message file'}
                  </Text>
                </VStack>
              </HStack>
            </CardHeader>

            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* File Name */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>File Name</FormLabel>
                  <Input
                    placeholder="Enter filename (without .txt)"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                  <Text fontSize="xs" color={textMuted} mt={1}>
                    .txt extension will be added automatically
                  </Text>
                </FormControl>

                {/* File Content */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>Message Content</FormLabel>
                  <Textarea
                    placeholder="Enter your message content..."
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    rows={12}
                    resize="vertical"
                    fontFamily="mono"
                  />
                </FormControl>

                {/* Content Stats */}
                {fileContent && (
                  <Card variant="compact" bg={bgSubtle}>
                    <CardBody p={4}>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color={textMuted}>Characters</Text>
                          <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                            {fileContent.length}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color={textMuted}>Words</Text>
                          <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                            {fileContent.split(/\s+/).filter(word => word.length > 0).length}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color={textMuted}>Lines</Text>
                          <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                            {fileContent.split('\n').length}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color={textMuted}>Size</Text>
                          <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                            {formatFileSize(new Blob([fileContent]).size)}
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                )}

                {/* Action Buttons */}
                <HStack spacing={3}>
                  <Button
                    colorScheme="blue"
                    onClick={saveMessage}
                    isLoading={loading}
                    loadingText={editingMessage ? "Updating..." : "Creating..."}
                    isDisabled={!fileName.trim() || !fileContent.trim()}
                    rightIcon={editingMessage ? <FiEdit /> : <FiPlus />}
                  >
                    {editingMessage ? 'Update Message' : 'Create Message'}
                  </Button>
                  
                  {editingMessage && (
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>

        {/* Right Column - Messages List */}
        <VStack spacing={6} align="stretch">
          <Card variant="elevated">
            <CardHeader>
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <Box p={2} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.100">
                    <Icon as={FiFile} color="green.600" boxSize={5} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                      Message Files
                    </Text>
                    <Text fontSize="sm" color={textSecondary}>
                      Manage your message files
                    </Text>
                  </VStack>
                </HStack>

                <IconButton
                  aria-label="Refresh"
                  icon={<FiRefreshCw />}
                  size="sm"
                  variant="ghost"
                  onClick={loadMessages}
                  isLoading={loading}
                />
              </HStack>
            </CardHeader>

            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Search */}
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftElement={<Icon as={FiSearch} color={textMuted} ml={3} />}
                />

                {/* Messages List */}
                {filteredMessages.length === 0 ? (
                  <VStack spacing={4} py={8}>
                    <Icon as={FiFile} boxSize={12} color={textMuted} />
                    <VStack spacing={1}>
                      <Text fontSize="md" fontWeight={500} color={textPrimary}>
                        {searchTerm ? 'No matching messages' : 'No message files yet'}
                      </Text>
                      <Text fontSize="sm" color={textMuted} textAlign="center">
                        {searchTerm ? 'Try different search terms' : 'Create your first message file to get started'}
                      </Text>
                    </VStack>
                  </VStack>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {filteredMessages.map((message) => (
                      <MessageCard key={message.id} message={message} />
                    ))}
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </SimpleGrid>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="start">
              <Text>
                Are you sure you want to delete this message file? This action cannot be undone.
              </Text>
              {messageToDelete && (
                <Card variant="compact" bg={bgSubtle} w="full">
                  <CardBody p={3}>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                        {messageToDelete.filename}
                      </Text>
                      <Text fontSize="xs" color={textSecondary}>
                        {formatFileSize(messageToDelete.size)} • {messageToDelete.content.length} characters
                      </Text>
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
                onClick={() => messageToDelete && deleteMessage(messageToDelete)}
                isLoading={loading}
              >
                Delete File
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default MessagesManager;
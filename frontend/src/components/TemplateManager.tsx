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
  Code,
  Divider,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiRefreshCw,
  FiSearch,
  FiInfo,
  FiTag,
} from 'react-icons/fi';
import { api } from '../lib/api';

interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
  created_date: string;
  usage_count: number;
}

const TemplateManager: React.FC = () => {
  // Data state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  
  // Form state
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textPrimary = useColorModeValue('gray.900', 'gray.50');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');
  const bgSubtle = useColorModeValue('gray.50', 'gray.850');

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    // Filter templates based on search term
    if (searchTerm.trim() === '') {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(
        templates.filter(template =>
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [templates, searchTerm]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/templates');
      // Mock data for now - replace with actual API response
      const mockTemplates: Template[] = [
        {
          id: '1',
          name: 'Welcome Message',
          content: 'Hello {{name}}! Welcome to our community. Feel free to ask any questions.',
          variables: ['name'],
          created_date: '2024-01-15',
          usage_count: 45
        },
        {
          id: '2',
          name: 'Daily Update',
          content: 'Good morning {{group}}! Here\'s your daily update for {{date}}:\n\n{{content}}\n\nHave a great day!',
          variables: ['group', 'date', 'content'],
          created_date: '2024-01-10',
          usage_count: 23
        }
      ];
      setTemplates(mockTemplates);
    } catch (err: any) {
      setError('Failed to load templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(match => match.slice(2, -2).trim())));
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !templateContent.trim()) {
      setError('Please enter template name and content');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const variables = extractVariables(templateContent);
      const templateData = {
        name: templateName,
        content: templateContent,
        variables
      };

      if (editingTemplate) {
        // Update existing template
        await api.put(`/templates/${editingTemplate.id}`, templateData);
        setSuccess('Template updated successfully!');
      } else {
        // Create new template
        await api.post('/templates', templateData);
        setSuccess('Template created successfully!');
      }

      resetForm();
      loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const editTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateContent(template.content);
  };

  const deleteTemplate = async (template: Template) => {
    setLoading(true);
    setError(null);

    try {
      await api.delete(`/templates/${template.id}`);
      setSuccess('Template deleted successfully!');
      loadTemplates();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete template');
    } finally {
      setLoading(false);
      setTemplateToDelete(null);
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateContent('');
    setEditingTemplate(null);
  };

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    onOpen();
  };

  const copyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    setSuccess('Template copied to clipboard!');
  };

  const TemplateCard = ({ template }: { template: Template }) => (
    <Card variant="elevated" className="scale-in">
      <CardBody p={4}>
        <VStack align="start" spacing={4}>
          {/* Header */}
          <HStack justify="space-between" w="full">
            <VStack align="start" spacing={1}>
              <Text fontSize="md" fontWeight={600} color={textPrimary}>
                {template.name}
              </Text>
              <HStack spacing={3}>
                <Badge colorScheme="blue" variant="subtle">
                  {template.usage_count} uses
                </Badge>
                <Text fontSize="xs" color={textMuted}>
                  Created {template.created_date}
                </Text>
              </HStack>
            </VStack>

            <HStack spacing={1}>
              <Tooltip label="Copy content">
                <IconButton
                  aria-label="Copy"
                  icon={<FiCopy />}
                  size="sm"
                  variant="ghost"
                  onClick={() => copyTemplate(template.content)}
                />
              </Tooltip>
              <Tooltip label="Edit template">
                <IconButton
                  aria-label="Edit"
                  icon={<FiEdit />}
                  size="sm"
                  variant="ghost"
                  onClick={() => editTemplate(template)}
                />
              </Tooltip>
              <Tooltip label="Delete template">
                <IconButton
                  aria-label="Delete"
                  icon={<FiTrash2 />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => handleDeleteClick(template)}
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
            <Text fontSize="sm" color={textSecondary} noOfLines={3}>
              {template.content}
            </Text>
          </Box>

          {/* Variables */}
          {template.variables.length > 0 && (
            <Box w="full">
              <Text fontSize="xs" fontWeight={500} color={textMuted} mb={2}>
                Variables:
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                {template.variables.map((variable) => (
                  <Code key={variable} fontSize="xs" colorScheme="blue">
                    {`{{${variable}}}`}
                  </Code>
                ))}
              </HStack>
            </Box>
          )}
        </VStack>
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
              <Box p={2} bg="purple.50" borderRadius="lg" border="1px solid" borderColor="purple.100">
                <Icon as={FiFileText} color="purple.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {templates.length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Total Templates
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.100">
                <Icon as={FiTag} color="green.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {templates.reduce((sum, t) => sum + t.usage_count, 0)}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Total Usage
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
                  {templates.reduce((sum, t) => sum + t.variables.length, 0)}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Variables Used
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
        {/* Left Column - Template Editor */}
        <VStack spacing={6} align="stretch">
          <Card variant="elevated">
            <CardHeader>
              <HStack spacing={3}>
                <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
                  <Icon as={editingTemplate ? FiEdit : FiPlus} color="blue.600" boxSize={5} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                    {editingTemplate ? 'Edit Template' : 'Create Template'}
                  </Text>
                  <Text fontSize="sm" color={textSecondary}>
                    {editingTemplate ? 'Update existing template' : 'Build a new message template'}
                  </Text>
                </VStack>
              </HStack>
            </CardHeader>

            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Template Name */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>Template Name</FormLabel>
                  <Input
                    placeholder="Enter template name..."
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </FormControl>

                {/* Template Content */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>Template Content</FormLabel>
                  <Textarea
                    placeholder="Enter your message template..."
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    rows={8}
                    resize="vertical"
                  />
                </FormControl>

                {/* Variables Preview */}
                {templateContent && extractVariables(templateContent).length > 0 && (
                  <Card variant="compact" bg={bgSubtle}>
                    <CardBody p={4}>
                      <VStack align="start" spacing={3}>
                        <HStack spacing={2}>
                          <Icon as={FiInfo} color="blue.500" boxSize={4} />
                          <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                            Detected Variables
                          </Text>
                        </HStack>
                        <HStack spacing={2} flexWrap="wrap">
                          {extractVariables(templateContent).map((variable) => (
                            <Code key={variable} fontSize="xs" colorScheme="blue">
                              {`{{${variable}}}`}
                            </Code>
                          ))}
                        </HStack>
                        <Text fontSize="xs" color={textMuted}>
                          These variables can be replaced with actual values when sending messages
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Variable Guide */}
                <Card variant="compact" bg={bgSubtle}>
                  <CardBody p={4}>
                    <VStack align="start" spacing={3}>
                      <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                        Variable Examples
                      </Text>
                      <VStack align="start" spacing={2}>
                        <HStack spacing={3}>
                          <Code fontSize="xs">{'{{name}}'}</Code>
                          <Text fontSize="xs" color={textSecondary}>Recipient name</Text>
                        </HStack>
                        <HStack spacing={3}>
                          <Code fontSize="xs">{'{{date}}'}</Code>
                          <Text fontSize="xs" color={textSecondary}>Current date</Text>
                        </HStack>
                        <HStack spacing={3}>
                          <Code fontSize="xs">{'{{group}}'}</Code>
                          <Text fontSize="xs" color={textSecondary}>Group name</Text>
                        </HStack>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Action Buttons */}
                <HStack spacing={3}>
                  <Button
                    colorScheme="blue"
                    onClick={saveTemplate}
                    isLoading={loading}
                    loadingText={editingTemplate ? "Updating..." : "Creating..."}
                    isDisabled={!templateName.trim() || !templateContent.trim()}
                    rightIcon={editingTemplate ? <FiEdit /> : <FiPlus />}
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                  
                  {editingTemplate && (
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>

        {/* Right Column - Templates List */}
        <VStack spacing={6} align="stretch">
          <Card variant="elevated">
            <CardHeader>
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <Box p={2} bg="purple.50" borderRadius="lg" border="1px solid" borderColor="purple.100">
                    <Icon as={FiFileText} color="purple.600" boxSize={5} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                      Template Library
                    </Text>
                    <Text fontSize="sm" color={textSecondary}>
                      Manage your message templates
                    </Text>
                  </VStack>
                </HStack>

                <IconButton
                  aria-label="Refresh"
                  icon={<FiRefreshCw />}
                  size="sm"
                  variant="ghost"
                  onClick={loadTemplates}
                  isLoading={loading}
                />
              </HStack>
            </CardHeader>

            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Search */}
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  // Search icon handled by placeholder
                />

                {/* Templates List */}
                {filteredTemplates.length === 0 ? (
                  <VStack spacing={4} py={8}>
                    <Icon as={FiFileText} boxSize={12} color={textMuted} />
                    <VStack spacing={1}>
                      <Text fontSize="md" fontWeight={500} color={textPrimary}>
                        {searchTerm ? 'No matching templates' : 'No templates yet'}
                      </Text>
                      <Text fontSize="sm" color={textMuted} textAlign="center">
                        {searchTerm ? 'Try different search terms' : 'Create your first template to get started'}
                      </Text>
                    </VStack>
                  </VStack>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {filteredTemplates.map((template) => (
                      <TemplateCard key={template.id} template={template} />
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
                Are you sure you want to delete this template? This action cannot be undone.
              </Text>
              {templateToDelete && (
                <Card variant="compact" bg={bgSubtle} w="full">
                  <CardBody p={3}>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                        {templateToDelete.name}
                      </Text>
                      <Text fontSize="xs" color={textSecondary} noOfLines={2}>
                        {templateToDelete.content}
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
                onClick={() => templateToDelete && deleteTemplate(templateToDelete)}
                isLoading={loading}
              >
                Delete Template
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default TemplateManager;
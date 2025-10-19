import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Typography from 'src/components/Typography';
import { useSettingsData } from 'src/hooks/useSettingsData';
import CircularProgress from 'src/components/CircularProgress';
import { Message } from 'src/core-ui/Message/Message';
import Toggle from 'src/core-ui/Toggle/Toggle';
import Card from 'src/core-ui/Card/Card';
import Button from 'src/core-ui/Button';
import { Input } from 'src/core-ui/Input/Input';
import {
  PlusIcon,
  Trash01Icon,
  Edit01Icon
} from '@legitsecurity/frontend-icons/icons/generated-icons';
import { useConfirmation } from 'src/components/GlobalConfirmationDialog/GlobalConfirmationDialogProvider';
import { RulesetsSettings } from './RulesetsSettings';
import { ModelMonitoringSettings } from './ModelMonitoringSettings';
import { FeatureToggles } from './FeatureToggles';

// Table of Contents Section Interface
interface TOCSection {
  id: string;
  title: string;
  description?: string;
}

// Table of Contents sections
const TOC_SECTIONS: TOCSection[] = [
  {
    id: 'feature-toggles',
    title: 'Capabilities',
    description: 'Enable or disable AI Guard capabilities'
  },
  {
    id: 'model-monitoring',
    title: 'Model Monitoring',
    description: 'Monitor AI model usage and performance'
  },
  {
    id: 'mcp-monitoring',
    title: 'MCP Monitoring',
    description: 'Configure Model Context Protocol monitoring'
  },
  {
    id: 'custom-instructions',
    title: 'Custom Instructions',
    description: 'Configure custom rulesets and instructions'
  }
];

// Removed TableOfContents component - now inlined with sticky positioning

export const SettingsTab = () => {
  const { confirm } = useConfirmation();
  const {
    mcpBlockingSettings,
    isLoading,
    error,
    createMcpBlockingSetting,
    updateMcpBlockingSetting,
    deleteMcpSetting
  } = useSettingsData();
  const [updatingSettings, setUpdatingSettings] = useState<Set<string>>(
    new Set()
  );
  const [deletingSettings, setDeletingSettings] = useState<Set<string>>(
    new Set()
  );
  const [showAddMcp, setShowAddMcp] = useState(false);
  const [newMcpUrl, setNewMcpUrl] = useState('');
  const [newMcpDescription, setNewMcpDescription] = useState('');

  // Edit state for MCP settings
  const [editingMcp, setEditingMcp] = useState<string | null>(null);
  const [editMcpUrl, setEditMcpUrl] = useState('');
  const [editMcpDescription, setEditMcpDescription] = useState('');

  // Router hooks for URL-based navigation
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll and navigation state
  const [activeSection, setActiveSection] = useState('feature-toggles');

  // Scroll to section handler using URL anchors
  const scrollToSection = (sectionId: string) => {
    // Update URL with anchor
    navigate(`/app/ai-guard/settings#${sectionId}`, { replace: true });

    // Set active section immediately
    setActiveSection(sectionId);

    // Use a more reliable scrolling approach
    setTimeout(() => {
      const sectionElement = document.getElementById(sectionId);
      if (sectionElement) {
        // Simple, reliable scrolling without any offset adjustments
        sectionElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }, 100);
  };

  // Handle URL anchor changes and scrolling
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && TOC_SECTIONS.find(section => section.id === hash)) {
      setActiveSection(hash);

      // Small delay to ensure DOM is ready, then scroll to section
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          // Simple, reliable scrolling without any offset adjustments
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 200);
    } else if (!hash) {
      // Default to first section if no hash
      setActiveSection('feature-toggles');
    }
  }, [location.hash]);

  const handleToggleChange = async (mcpId: string, blocked: boolean) => {
    setUpdatingSettings(prev => new Set([...prev, mcpId]));

    try {
      await updateMcpBlockingSetting(
        mcpId,
        blocked,
        mcpBlockingSettings[mcpId]?.description
      );
    } finally {
      setUpdatingSettings(prev => {
        const newSet = new Set(prev);
        newSet.delete(mcpId);
        return newSet;
      });
    }
  };

  const handleStartEdit = (mcpId: string) => {
    const setting = mcpBlockingSettings[mcpId];
    setEditingMcp(mcpId);
    setEditMcpUrl(setting.mcpUrl);
    setEditMcpDescription(setting.description);
  };

  const handleCancelEdit = () => {
    setEditingMcp(null);
    setEditMcpUrl('');
    setEditMcpDescription('');
  };

  const handleUpdateMcp = async (mcpId: string) => {
    if (!editMcpUrl.trim() || !editMcpDescription.trim()) {
      await confirm('Validation Error', 'Please fill in all required fields', {
        hideCancelButton: true,
        approveText: 'OK'
      });
      return;
    }

    setUpdatingSettings(prev => new Set([...prev, mcpId]));

    try {
      await updateMcpBlockingSetting(
        mcpId,
        mcpBlockingSettings[mcpId]?.blocked || false,
        editMcpDescription.trim()
      );
      setEditingMcp(null);
    } finally {
      setUpdatingSettings(prev => {
        const newSet = new Set(prev);
        newSet.delete(mcpId);
        return newSet;
      });
    }
  };

  const handleDeleteMcp = async (mcpId: string) => {
    const mcpSetting = mcpBlockingSettings[mcpId];
    const displayUrl = mcpSetting?.mcpUrl || mcpId;

    const confirmed = await confirm(
      'Remove MCP Server',
      `Are you sure you want to remove ${displayUrl} from monitoring?`,
      { isDestructive: true, approveText: 'Remove', cancelText: 'Cancel' }
    );

    if (!confirmed) {
      return;
    }

    setDeletingSettings(prev => new Set([...prev, mcpId]));

    try {
      await deleteMcpSetting(mcpId);
    } finally {
      setDeletingSettings(prev => {
        const newSet = new Set(prev);
        newSet.delete(mcpId);
        return newSet;
      });
    }
  };

  const handleAddNewMcp = async () => {
    if (!newMcpUrl.trim()) {
      await confirm('Validation Error', 'Please enter a MCP Server URL', {
        hideCancelButton: true,
        approveText: 'OK'
      });
      return;
    }

    if (!newMcpDescription.trim()) {
      await confirm(
        'Validation Error',
        'Please enter a name for this MCP server',
        { hideCancelButton: true, approveText: 'OK' }
      );
      return;
    }

    setUpdatingSettings(prev => new Set([...prev, newMcpUrl]));

    try {
      await createMcpBlockingSetting(
        newMcpUrl.trim(),
        false, // Default to monitoring without alerts
        newMcpDescription.trim()
      );

      setNewMcpUrl('');
      setNewMcpDescription('');
      setShowAddMcp(false);
    } finally {
      setUpdatingSettings(prev => {
        const newSet = new Set(prev);
        newSet.delete(newMcpUrl);
        return newSet;
      });
    }
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center gap-y-4 p-4xl">
      <CircularProgress height={48} width={48} />
      <Typography variant="text-lg">Loading settings...</Typography>
    </div>
  );

  const renderErrorState = () => (
    <div className="flex flex-col items-center gap-y-4 p-4xl">
      <Message variant="error">
        <div>
          <Typography weight="semiBold" className="mb-xs">
            Failed to load settings
          </Typography>
          <Typography variant="text-sm">{error}</Typography>
        </div>
      </Message>
    </div>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  if (error) {
    return renderErrorState();
  }

  const mcpEntries = Object.entries(mcpBlockingSettings);

  return (
    <div className="flex bg-white min-h-screen">
      {/* Table of Contents - Left Sidebar */}
      <div className="flex-shrink-0 bg-gray-50 border-r border-gray-200">
        <div className="sticky top-6 p-sm">
          <Typography
            variant="text-md"
            weight="semiBold"
            className="mb-lg text-gray-900"
          >
            Settings
          </Typography>
          <nav className="space-y-1">
            {TOC_SECTIONS.map(section => (
              <button
                type="button"
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-sm py-xs.5 rounded text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-purple-100 text-purple-700 border-l-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-sm leading-tight">
                  {section.title}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content - Right Side */}
      <div className="flex-1">
        <div
          className="max-w-4xl mx-auto p-3xl space-y-16"
          style={{ paddingBottom: '100vh' }}
        >
          {/* Capabilities Section */}
          <section id="feature-toggles" className="scroll-mt-3xl">
            <FeatureToggles />
          </section>

          {/* Model Monitoring Section */}
          <section id="model-monitoring" className="scroll-mt-3xl">
            <ModelMonitoringSettings />
          </section>

          {/* MCP Monitoring Configuration Section */}
          <section id="mcp-monitoring" className="scroll-mt-3xl">
            <div className="mb-3xl">
              <Typography
                variant="text-xl"
                weight="semiBold"
                className="mb-sm text-gray-900"
              >
                MCP Monitoring Configuration
              </Typography>
              <Typography variant="text-sm" className="text-gray-600">
                Configure monitoring and alerting for Model Context Protocol
                (MCP) tools in your environment.
              </Typography>
            </div>

            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-3xl">
              <div>
                <Typography
                  variant="text-lg"
                  weight="medium"
                  className="text-gray-800"
                >
                  MCP Servers
                </Typography>
              </div>
              <Button
                variant="primary"
                size="small"
                leftIcon={<PlusIcon className="w-xl h-xl" />}
                onClick={() => setShowAddMcp(true)}
                disabled={showAddMcp}
              >
                Add
              </Button>
            </div>

            {/* MCP Settings List */}
            <div className="space-y-4">
              {mcpEntries.length === 0 ? (
                <Card className="p-4xl text-center">
                  <Typography
                    variant="text-md"
                    weight="medium"
                    className="mb-sm"
                  >
                    No MCP tools configured
                  </Typography>
                  <Typography variant="text-sm" className="text-gray-500">
                    Add MCP tools to configure their monitoring and alerting
                    settings.
                  </Typography>
                </Card>
              ) : (
                mcpEntries.map(([mcpId, setting]) => {
                  return (
                    <Card key={mcpId} className="p-xl">
                      {editingMcp === mcpId ? (
                        <div className="space-y-4">
                          <Typography
                            variant="text-md"
                            weight="medium"
                            className="mb-lg"
                          >
                            Edit MCP Server
                          </Typography>
                          <div className="space-y-3">
                            <div>
                              <Typography
                                variant="text-sm"
                                weight="medium"
                                className="mb-sm"
                              >
                                MCP Server URL
                              </Typography>
                              <Input
                                value={editMcpUrl}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) => setEditMcpUrl(e.target.value)}
                                className="w-full"
                                disabled // URL should not be editable
                              />
                            </div>
                            <div>
                              <Typography
                                variant="text-sm"
                                weight="medium"
                                className="mb-sm"
                              >
                                Name
                              </Typography>
                              <Input
                                value={editMcpDescription}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) => setEditMcpDescription(e.target.value)}
                                className="w-full"
                              />
                            </div>
                            <div className="flex gap-sm">
                              <Button
                                variant="primary"
                                size="small"
                                onClick={() => handleUpdateMcp(mcpId)}
                                disabled={
                                  !editMcpDescription.trim() ||
                                  updatingSettings.has(mcpId)
                                }
                                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0"
                              >
                                {updatingSettings.has(mcpId)
                                  ? 'Saving...'
                                  : 'Save'}
                              </Button>
                              <Button
                                variant="secondary"
                                size="small"
                                onClick={handleCancelEdit}
                                disabled={updatingSettings.has(mcpId)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-lg">
                              <Typography variant="text-md" weight="medium">
                                {setting.description}
                              </Typography>
                              {(updatingSettings.has(mcpId) ||
                                deletingSettings.has(mcpId)) && (
                                <CircularProgress height={16} width={16} />
                              )}
                            </div>
                            <Typography
                              variant="text-xs"
                              className="text-gray-400 mt-xs font-mono"
                            >
                              {setting.mcpUrl}
                            </Typography>
                          </div>
                          <div className="flex items-center gap-lg">
                            <div className="text-right">
                              <Typography
                                variant="text-xs"
                                className="text-gray-500 uppercase tracking-wide"
                              >
                                {setting.blocked ? 'BLOCK' : 'MONITOR ONLY'}
                              </Typography>
                            </div>
                            <Toggle
                              toggle={setting.blocked}
                              onToggle={() =>
                                handleToggleChange(mcpId, !setting.blocked)
                              }
                              disabled={
                                updatingSettings.has(mcpId) ||
                                deletingSettings.has(mcpId) ||
                                editingMcp !== null
                              }
                              size="sm"
                            />
                            <Button
                              variant="tertiary"
                              size="small"
                              onClick={() => handleStartEdit(mcpId)}
                              disabled={
                                updatingSettings.has(mcpId) ||
                                deletingSettings.has(mcpId) ||
                                editingMcp !== null
                              }
                              leftIcon={<Edit01Icon className="w-xl h-xl" />}
                            />
                            <Button
                              variant="tertiary-destructive"
                              size="small"
                              onClick={() => handleDeleteMcp(mcpId)}
                              disabled={
                                updatingSettings.has(mcpId) ||
                                deletingSettings.has(mcpId) ||
                                editingMcp !== null
                              }
                              leftIcon={<Trash01Icon className="w-xl h-xl" />}
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>

            {/* Add New MCP Section */}
            {showAddMcp && (
              <div className="mt-3xl">
                <Card className="p-xl">
                  <Typography
                    variant="text-md"
                    weight="medium"
                    className="mb-xl"
                  >
                    Add New MCP Server
                  </Typography>
                  <div className="space-y-4">
                    <div>
                      <Typography
                        variant="text-sm"
                        weight="medium"
                        className="mb-sm"
                      >
                        MCP Server URL
                      </Typography>
                      <Input
                        placeholder="e.g., https://api.githubcopilot.com/mcp/"
                        value={newMcpUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewMcpUrl(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Typography
                        variant="text-sm"
                        weight="medium"
                        className="mb-sm"
                      >
                        Name
                      </Typography>
                      <Input
                        placeholder="e.g., GitHub Copilot MCP"
                        value={newMcpDescription}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewMcpDescription(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-sm">
                      <Button
                        variant="primary"
                        size="small"
                        onClick={handleAddNewMcp}
                        disabled={
                          !newMcpUrl.trim() ||
                          !newMcpDescription.trim() ||
                          updatingSettings.has(newMcpUrl)
                        }
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0"
                      >
                        {updatingSettings.has(newMcpUrl) ? 'Adding...' : 'Add'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => {
                          setShowAddMcp(false);
                          setNewMcpUrl('');
                          setNewMcpDescription('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </section>

          {/* Custom Instructions Section */}
          <section id="custom-instructions" className="scroll-mt-3xl">
            <RulesetsSettings />
          </section>
        </div>
      </div>
    </div>
  );
};

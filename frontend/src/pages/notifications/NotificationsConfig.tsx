import { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Card, Button, TextField, Tabs, Separator, Container, Theme, Switch, Dialog, Select } from '@radix-ui/themes';
import { BellIcon, PlusIcon, CheckCircledIcon, CrossCircledIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import * as Toast from '@radix-ui/react-toast';
import '../../styles/components.css';
import { useTranslation } from 'react-i18next';
import { getAllMonitors, Monitor } from '../../api/monitors';
import { getAllAgents, Agent } from '../../api/agents';
import { 
  NotificationChannel as ApiNotificationChannel, 
  NotificationTemplate as ApiNotificationTemplate, 
  NotificationSettings as ApiNotificationSettings,
  getNotificationConfig,
  saveNotificationSettings,
  createNotificationChannel,
  updateNotificationChannel,
  deleteNotificationChannel,
} from '../../api/notifications';

const NotificationsConfig = () => {
  const [channels, setChannels] = useState<ApiNotificationChannel[]>([]);
  const [templates, setTemplates] = useState<ApiNotificationTemplate[]>([]);
  const [settings, setSettings] = useState<ApiNotificationSettings | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitorsLoading, setMonitorsLoading] = useState(true);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showInfoToast, setShowInfoToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Channel management state
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [isDeleteChannelOpen, setIsDeleteChannelOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [channelForm, setChannelForm] = useState({
    name: '',
    type: 'telegram',
    config: {
      // Telegram configuration
      botToken: '',
      chatId: '',
      // Resend configuration (替代原来的 email configuration)
      apiKey: '',
      from: '',
      to: ''
    },
    enabled: true
  });
  const [channelFormErrors, setChannelFormErrors] = useState({
    name: '',
    botToken: '',
    chatId: '',
    apiKey: '',
    from: '',
    to: ''
  });
  
  const { t } = useTranslation();

  // 加载通知配置数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // 使用实际API调用获取通知配置
        const configResponse = await getNotificationConfig();
        
        if (configResponse.success && configResponse.data) {
          setChannels(configResponse.data.channels);
          setTemplates(configResponse.data.templates);
          setSettings(configResponse.data.settings);
        } else {
          console.error('获取通知配置失败:', configResponse.message);
          setShowErrorToast(true);
          setToastMessage(t('notifications.fetch.error'));
        }
      } catch (error) {
        console.error('加载通知设置失败', error);
        setShowErrorToast(true);
        setToastMessage(t('notifications.fetch.error'));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [t]);
  
  // 加载监控和客户端列表
  useEffect(() => {
    const loadMonitorsAndAgents = async () => {
      setMonitorsLoading(true);
      setAgentsLoading(true);
      
      try {
        // 获取监控列表
        const monitorsResponse = await getAllMonitors();
        if (monitorsResponse.success && monitorsResponse.monitors) {
          setMonitors(monitorsResponse.monitors);
        } else {
          console.error('获取监控数据失败:', monitorsResponse.message);
        }
      } catch (error) {
        console.error('获取监控列表失败', error);
      } finally {
        setMonitorsLoading(false);
      }
      
      try {
        // 获取客户端列表
        const agentsResponse = await getAllAgents();
        if (agentsResponse.success && agentsResponse.agents) {
          setAgents(agentsResponse.agents);
        } else {
          console.error('获取客户端数据失败:', agentsResponse.message);
        }
      } catch (error) {
        console.error('获取客户端列表失败', error);
      } finally {
        setAgentsLoading(false);
      }
    };
    
    loadMonitorsAndAgents();
  }, []);

  // 设置处理函数
  const handleMonitorSettingChange = (key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      monitors: {
        ...settings.monitors,
        [key]: value
      }
    });
  };

  const handleAgentSettingChange = (key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      agents: {
        ...settings.agents,
        [key]: value
      }
    });
  };

  
  // 特定监控的设置更新
  const handleSpecificMonitorSettingChange = (monitorId: string, key: string, value: any) => {
    if (!settings) return;
    
    const currentSettings = settings.specificMonitors[monitorId] || {
      enabled: false,
      onDown: false,
      onRecovery: false,
      channels: [],
      overrideGlobal: false
    };
    
    // 当自定义设置开关打开时，自动设置启用状态为true
    let updatedSettings = {
      ...currentSettings,
      [key]: value
    };
    
    // 如果是打开overrideGlobal开关，则自动设置enabled为true
    if (key === 'overrideGlobal' && value === true) {
      updatedSettings.enabled = true;
    }
    
    setSettings({
      ...settings,
      specificMonitors: {
        ...settings.specificMonitors,
        [monitorId]: updatedSettings
      }
    });
  };
  
  // 特定客户端的设置更新
  const handleSpecificAgentSettingChange = (agentId: string, key: string, value: any) => {
    if (!settings) return;
    
    const currentSettings = settings.specificAgents[agentId] || {
      enabled: false,
      onOffline: false,
      onRecovery: false,
      onCpuThreshold: false,
      cpuThreshold: 90,
      onMemoryThreshold: false,
      memoryThreshold: 85,
      onDiskThreshold: false,
      diskThreshold: 90,
      channels: [],
      overrideGlobal: false
    };
    
    // 当自定义设置开关打开时，自动设置启用状态为true
    let updatedSettings = {
      ...currentSettings,
      [key]: value
    };
    
    // 如果是打开overrideGlobal开关，则自动设置enabled为true
    if (key === 'overrideGlobal' && value === true) {
      updatedSettings.enabled = true;
    }
    
    setSettings({
      ...settings,
      specificAgents: {
        ...settings.specificAgents,
        [agentId]: updatedSettings
      }
    });
  };

  // 保存设置
  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      // 使用实际API调用保存通知设置
      const response = await saveNotificationSettings(settings);
      
      if (response.success) {
        setToastMessage(t('notifications.save.success'));
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        setToastMessage(response.message || t('notifications.save.error'));
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
      }
    } catch (err) {
      console.error('保存通知设置失败', err);
      setToastMessage(t('notifications.save.error'));
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // 打开添加渠道对话框
  const handleAddChannelClick = () => {
    // 重置表单
    setChannelForm({
      name: '',
      type: 'telegram', // 默认选择Telegram
      config: {
        // Telegram配置
        botToken: '',
        chatId: '',
        // Resend配置（替代原来的邮件配置）
        apiKey: '',
        from: '',
        to: ''
      },
      enabled: true
    });
    setChannelFormErrors({
      name: '',
      botToken: '',
      chatId: '',
      apiKey: '',
      from: '',
      to: ''
    });
    setIsAddChannelOpen(true);
  };
  
  // 打开编辑渠道对话框
  const handleEditChannelClick = (channel: ApiNotificationChannel) => {
    // 确保渠道ID是有效的数字
    if (!channel.id || isNaN(Number(channel.id))) {
      console.error('无效的渠道ID:', channel.id);
      setToastMessage(t('notifications.channels.invalidId'));
      setShowErrorToast(true);
      return;
    }
    
    setSelectedChannelId(channel.id);
    
    // 根据渠道类型设置表单
    if (channel.type === 'telegram') {
      let config = channel.config ? (typeof channel.config === 'string' ? JSON.parse(channel.config) : channel.config) : {};
      
      // 确保config是一个对象
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch (e) {
          console.error('解析Telegram渠道配置失败:', e);
          config = {};
        }
      }
      
      console.log('编辑Telegram渠道, 原始配置:', config);
      
      // 允许编辑默认渠道的配置，不再特殊处理
      setChannelForm({
        name: channel.name,
        type: channel.type,
        config: {
          botToken: config.botToken || '',
          chatId: config.chatId || '',
          apiKey: '',
          from: '',
          to: ''
        },
        enabled: channel.enabled
      });
    } else if (channel.type === 'resend') {
      let config = channel.config || {};
      
      // 确保config是一个对象
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch (e) {
          console.error('解析Resend渠道配置失败:', e);
          config = {};
        }
      }
      
      console.log('编辑Resend渠道, 原始配置:', config);
      
      setChannelForm({
        name: channel.name,
        type: channel.type,
        config: {
          botToken: '',
          chatId: '',
          apiKey: config.apiKey || '',
          from: config.from || '',
          to: config.to || ''
        },
        enabled: channel.enabled
      });
    } else {
      // 对于其他类型的渠道，处理配置
      let config = channel.config || {};
      
      // 确保config是一个对象
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch (e) {
          console.error(`解析渠道类型${channel.type}的配置失败:`, e);
          config = {};
        }
      }
      
      console.log(`编辑${channel.type}渠道, 原始配置:`, config);
      
      // 对于其他类型的渠道，合并现有配置
      setChannelForm({
        name: channel.name,
        type: channel.type,
        config: {
          ...config,  // 保留所有现有配置
          // 设置默认值，避免undefined
          botToken: config.botToken || '',
          chatId: config.chatId || '',
          apiKey: config.apiKey || '',
          from: config.from || '',
          to: config.to || ''
        },
        enabled: channel.enabled
      });
    }
    
    setChannelFormErrors({
      name: '',
      botToken: '',
      chatId: '',
      apiKey: '',
      from: '',
      to: ''
    });
    setIsEditChannelOpen(true);
  };
  
  // 打开删除渠道确认对话框
  const handleDeleteChannelClick = (channelId: string) => {
    // 确保channelId是有效的数字
    if (!channelId || isNaN(Number(channelId))) {
      console.error('无效的渠道ID:', channelId);
      setToastMessage(t('notifications.channels.invalidId'));
      setShowErrorToast(true);
      return;
    }
    
    setSelectedChannelId(channelId);
    setIsDeleteChannelOpen(true);
  };
  
  // 验证渠道表单
  const validateChannelForm = (): boolean => {
    const errors = {
      name: '',
      botToken: '',
      chatId: '',
      apiKey: '',
      from: '',
      to: ''
    };
    
    let isValid = true;
    
    // 验证名称
    if (!channelForm.name.trim()) {
      errors.name = t('notifications.channels.errors.nameRequired');
      isValid = false;
    }
    
    // 验证Telegram配置
    if (channelForm.type === 'telegram') {
      if (!channelForm.config.botToken.trim()) {
        errors.botToken = t('notifications.channels.errors.botTokenRequired');
        isValid = false;
      }
      
      if (!channelForm.config.chatId.trim()) {
        errors.chatId = t('notifications.channels.errors.chatIdRequired');
        isValid = false;
      }
    }
    
    // 验证Resend配置
    if (channelForm.type === 'resend') {
      if (!channelForm.config.apiKey.trim()) {
        errors.apiKey = t('notifications.channels.errors.apiKeyRequired');
        isValid = false;
      }
      
      if (!channelForm.config.from.trim()) {
        errors.from = t('notifications.channels.errors.fromRequired');
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(channelForm.config.from) && 
                 !/^.+\s<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(channelForm.config.from)) {
        errors.from = t('notifications.channels.errors.invalidFromEmail');
        isValid = false;
      }
      
      if (!channelForm.config.to.trim()) {
        errors.to = t('notifications.channels.errors.toRequired');
        isValid = false;
      }
    }
    
    setChannelFormErrors(errors);
    return isValid;
  };
  
  // 保存渠道
  const handleSaveChannel = async () => {
    if (!validateChannelForm()) {
      return;
    }

    setSaving(true);

    try {
      let channelData: any = {
        name: channelForm.name,  // 使用用户输入的名称
        type: channelForm.type,
        enabled: channelForm.enabled
      };

      // 处理配置
      if (channelForm.type === 'telegram') {
        const configObj = {
          botToken: channelForm.config.botToken,
          chatId: channelForm.config.chatId
        };
        // 将配置对象转换为字符串
        channelData.config = JSON.stringify(configObj);
      } else if (channelForm.type === 'resend') {
        const configObj = {
          apiKey: channelForm.config.apiKey,
          from: channelForm.config.from,
          to: channelForm.config.to
        };
        channelData.config = JSON.stringify(configObj);
      } else {
        // 将其他类型的配置也转换为字符串
        channelData.config = JSON.stringify(channelForm.config);
      }
      
      // 保存通知渠道
      if (isEditChannelOpen && selectedChannelId) {
        // 更新现有渠道
        const response = await updateNotificationChannel(selectedChannelId, channelData);
        
        if (response && response.success) {
          // 刷新渠道列表
          const configResponse = await getNotificationConfig();
          if (configResponse.success && configResponse.data) {
            setChannels(configResponse.data.channels);
          }
          
          // 显示成功消息
          setToastMessage(t('notifications.channels.updateSuccess'));
          setShowSuccessToast(true);
          
          // 关闭对话框
          setIsAddChannelOpen(false);
          setIsEditChannelOpen(false);
        } else {
          // 显示错误消息
          setToastMessage((response && response.message) || t('common.unknownError'));
          setShowErrorToast(true);
        }
      } else {
        // 创建新渠道
        const response = await createNotificationChannel(channelData);
        
        if (response && response.success) {
          // 刷新渠道列表
          const configResponse = await getNotificationConfig();
          if (configResponse.success && configResponse.data) {
            setChannels(configResponse.data.channels);
          }
          
          // 显示成功消息
          setToastMessage(t('notifications.channels.createSuccess'));
          setShowSuccessToast(true);
          
          // 关闭对话框
          setIsAddChannelOpen(false);
          setIsEditChannelOpen(false);
        }
      }
    } catch (error) {
      console.error('保存通知渠道失败', error);
      setToastMessage(t('notifications.channels.saveError'));
      setShowErrorToast(true);
    } finally {
      setSaving(false);
    }
  };
  
  // 删除渠道
  const handleConfirmDeleteChannel = async () => {
    if (!selectedChannelId || isNaN(Number(selectedChannelId))) {
      console.error('无效的渠道ID:', selectedChannelId);
      setToastMessage(t('notifications.channels.invalidId'));
      setShowErrorToast(true);
      return;
    }
    
    setSaving(true);
    try {
      const response = await deleteNotificationChannel(selectedChannelId);
      
      if (response.success) {
        // 从列表中移除渠道
        setChannels(channels.filter(channel => channel.id !== selectedChannelId));
        
        // 显示成功消息
        setToastMessage(t('notifications.channels.deleteSuccess'));
        setShowSuccessToast(true);
        
        // 关闭对话框
        setIsDeleteChannelOpen(false);
      } else {
        // 显示错误消息
        setToastMessage(response.message || t('common.unknownError'));
        setShowErrorToast(true);
      }
    } catch (error) {
      console.error('删除通知渠道失败', error);
      setToastMessage(t('notifications.channels.deleteError'));
      setShowErrorToast(true);
    } finally {
      setSaving(false);
    }
  };
  
  // 处理添加模板
  const handleAddTemplateClick = () => {
    // 这里未来可以实现添加模板功能
    setToastMessage(t('notifications.templates.comingSoon'));
    setShowInfoToast(true);
    setTimeout(() => setShowInfoToast(false), 3000);
  };
  
  // 打开编辑模板对话框
  const handleEditTemplateClick = (template: ApiNotificationTemplate) => {
    if (!template.id) {
      console.error('无效的模板ID:', template.id);
      setToastMessage(t('common.error.invalidId'));
      setShowErrorToast(true);
      return;
    }
    
    setToastMessage(t('notifications.templates.comingSoon'));
    setShowInfoToast(true);
    setTimeout(() => setShowInfoToast(false), 3000);
    
    // 以下是未来实现编辑模板对话框的注释代码
    // setIsEditTemplateOpen(true);
  };
  
  // 渲染添加/编辑渠道对话框
  const renderChannelDialog = () => {
    const isOpen = isAddChannelOpen || isEditChannelOpen;
    const title = isEditChannelOpen 
      ? t('notifications.channels.edit') 
      : t('notifications.channels.add');
    
    // 如果是编辑模式，确保表单中显示的是完整的现有配置
    // 所有的配置字段都已经在handleEditChannelClick函数中被正确解析并设置
    return (
      <Dialog.Root 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddChannelOpen(false);
            setIsEditChannelOpen(false);
          }
        }}
      >
        <Dialog.Content style={{ maxWidth: '450px' }}>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {t('notifications.channels.dialogDescription')}
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <Box>
              <Text as="label" size="2" mb="1" weight="medium">
                {t('notifications.channels.name')}
              </Text>
              <Box mt="1">
                <TextField.Input
                  placeholder={t('notifications.channels.namePlaceholder')}
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({...channelForm, name: e.target.value})}
                />
              </Box>
              {channelFormErrors.name && (
                <Text size="1" color="red" mt="1">{channelFormErrors.name}</Text>
              )}
            </Box>
            
            <Box>
              <Text as="label" size="2" mb="1" weight="medium">
                {t('common.type')}
              </Text>
              <Box mt="1">
                <Select.Root 
                  defaultValue={channelForm.type}
                  value={channelForm.type}
                  onValueChange={(value) => {
                    // 切换类型时，重置表单错误
                    setChannelFormErrors({
                      name: '',
                      botToken: '',
                      chatId: '',
                      apiKey: '',
                      from: '',
                      to: ''
                    });
                    
                    // 根据选择的类型设置默认的配置值
                    setChannelForm({
                      ...channelForm,
                      type: value,
                      config: value === 'telegram' 
                        ? { 
                            botToken: '', 
                            chatId: '', 
                            apiKey: '',
                            from: '',
                            to: ''
                          } 
                        : { 
                            botToken: '', 
                            chatId: '', 
                            apiKey: '',
                            from: '',
                            to: ''
                          }
                    });
                    
                    console.log(`[通知渠道] 选择类型: ${value}`); // 调试信息
                  }}
                >
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="telegram">{t('notifications.channels.type.telegram')}</Select.Item>
                    <Select.Item value="resend">{t('notifications.channels.type.resend')}</Select.Item>
                    <Select.Item value="webhook" disabled>{t('notifications.channels.type.webhook')} (Coming Soon)</Select.Item>
                    <Select.Item value="slack" disabled>{t('notifications.channels.type.slack')} (Coming Soon)</Select.Item>
                    <Select.Item value="dingtalk" disabled>{t('notifications.channels.type.dingtalk')} (Coming Soon)</Select.Item>
                    <Select.Item value="wecom" disabled>{t('notifications.channels.type.wecom')} (Coming Soon)</Select.Item>
                    <Select.Item value="feishu" disabled>{t('notifications.channels.type.feishu')} (Coming Soon)</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>
            </Box>
            
            {channelForm.type === 'telegram' && (
              <>
                <Box>
                  <Text as="label" size="2" mb="1" weight="medium">
                    Bot Token
                  </Text>
                  <Box mt="1">
                    <TextField.Input
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      value={channelForm.config.botToken}
                      onChange={(e) => setChannelForm({
                        ...channelForm, 
                        config: {
                          ...channelForm.config, 
                          botToken: e.target.value
                        }
                      })}
                    />
                  </Box>
                  {channelFormErrors.botToken && (
                    <Text size="1" color="red" mt="1">{channelFormErrors.botToken}</Text>
                  )}
                </Box>
                
                <Box>
                  <Text as="label" size="2" mb="1" weight="medium">
                    Chat ID
                  </Text>
                  <Box mt="1">
                    <TextField.Input
                      placeholder="123456789"
                      value={channelForm.config.chatId}
                      onChange={(e) => setChannelForm({
                        ...channelForm, 
                        config: {
                          ...channelForm.config, 
                          chatId: e.target.value
                        }
                      })}
                    />
                  </Box>
                  {channelFormErrors.chatId && (
                    <Text size="1" color="red" mt="1">{channelFormErrors.chatId}</Text>
                  )}
                </Box>
              </>
            )}
            
            {channelForm.type === 'resend' && (
              <>
                <Box>
                  <Text as="label" size="2" mb="1" weight="medium">
                    {t('notifications.channels.apiKey')}
                  </Text>
                  <TextField.Input
                    type="password"
                    placeholder="re_123456789"
                    value={channelForm.config.apiKey}
                    onChange={(e) => setChannelForm({
                      ...channelForm, 
                      config: {
                        ...channelForm.config, 
                        apiKey: e.target.value
                      }
                    })}
                  />
                  {channelFormErrors.apiKey && (
                    <Text size="1" color="red" mt="1">{channelFormErrors.apiKey}</Text>
                  )}
                </Box>
                
                <Box>
                  <Text as="label" size="2" mb="1" weight="medium">
                    {t('notifications.channels.from')}
                  </Text>
                  <TextField.Input
                    placeholder="您的名称 <no-reply@yourdomain.com>"
                    value={channelForm.config.from}
                    onChange={(e) => setChannelForm({
                      ...channelForm, 
                      config: {
                        ...channelForm.config, 
                        from: e.target.value
                      }
                    })}
                  />
                  {channelFormErrors.from && (
                    <Text size="1" color="red" mt="1">{channelFormErrors.from}</Text>
                  )}
                  <Text size="1" color="gray" mt="1">
                    {t('notifications.channels.fromHint')}
                  </Text>
                </Box>
                
                <Box>
                  <Text as="label" size="2" mb="1" weight="medium">
                    {t('notifications.channels.to')}
                  </Text>
                  <TextField.Input
                    placeholder="user1@example.com, user2@example.com"
                    value={channelForm.config.to}
                    onChange={(e) => setChannelForm({
                      ...channelForm, 
                      config: {
                        ...channelForm.config,
                        to: e.target.value
                      }
                    })}
                  />
                  {channelFormErrors.to && (
                    <Text size="1" color="red" mt="1">{channelFormErrors.to}</Text>
                  )}
                </Box>
              </>
            )}
          </Flex>

          <Flex gap="3" mt="6" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" size="2">
                {t('common.cancel')}
              </Button>
            </Dialog.Close>
            <Button onClick={handleSaveChannel} disabled={saving} size="2">
              {saving ? t('common.savingChanges') : t('common.save')}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  };
  
  // 渲染删除确认对话框
  const renderDeleteDialog = () => {
    return (
      <Dialog.Root 
        open={isDeleteChannelOpen} 
        onOpenChange={(open) => {
          if (!open) setIsDeleteChannelOpen(false);
        }}
      >
        <Dialog.Content style={{ maxWidth: '450px' }}>
          <Dialog.Title>{t('notifications.channels.deleteConfirmTitle')}</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {t('notifications.channels.deleteConfirmMessage')}
          </Dialog.Description>

          <Flex gap="3" mt="6" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" size="2">
                {t('common.cancel')}
              </Button>
            </Dialog.Close>
            <Button color="red" onClick={handleConfirmDeleteChannel} disabled={saving} size="2">
              {saving ? t('common.deleting') : t('common.delete')}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  };

  // 渲染全局通知设置标签页（整合设置、渠道和模板）
  const renderGlobalSettingsTab = () => {
    if (!settings) return <Text>{t('common.loading')}...</Text>;
    
    return (
      <Flex direction="column" gap="5">
        <Text size="2" color="gray" mb="3">{t('notifications.globalSettings.description')}</Text>
        
        {/* 通知渠道部分 */}
        <Box>
          <Flex justify="between" align="center" mb="3">
            <Heading size="3">{t('notifications.channels.title')}</Heading>
            <Button 
              size="3" 
              color="blue"
              variant="soft"
              style={{ padding: '0 16px', fontWeight: 'bold' }}
              onClick={handleAddChannelClick}
            >
              <PlusIcon width="16" height="16" style={{ marginRight: '6px' }} />
              {t('notifications.channels.add')}
            </Button>
          </Flex>
          
          <Card mb="5">
            <Box p="3">
              <Text size="2" color="gray" mb="3">{t('notifications.channels.description')}</Text>
              
              {channels.length === 0 ? (
                <Text color="gray">{t('notifications.channels.noChannels')}</Text>
              ) : (
                <Flex direction="column" gap="3">
                  {channels.map(channel => (
                    <Card key={channel.id} mb="2" style={{ padding: '12px' }}>
                      <Flex justify="between" align="center">
                        <Flex direction="column" gap="1">
                          <Flex gap="2" align="center">
                            <Text weight="medium">{channel.name}</Text>
                            {channel.type === 'telegram' && 
                             channel.config && 
                             (() => {
                               try {
                                 const config = typeof channel.config === 'string' 
                                   ? JSON.parse(channel.config) 
                                   : channel.config;
                                 return config.botToken === '8163201319:AAGyY7FtdaRb6o8NCVXSbBUb6ofDK45cNJU' && 
                                        config.chatId === '-1002608818360';
                               } catch (e) {
                                 return false;
                               }
                             })() && (
                              <Text size="1" style={{ 
                                backgroundColor: 'var(--blue-3)', 
                                color: 'var(--blue-11)', 
                                padding: '2px 6px', 
                                borderRadius: '4px' 
                              }}>
                                {t('common.default')}
                              </Text>
                            )}
                          </Flex>
                          <Text size="1" color="gray">{t(`notifications.channels.type.${channel.type}`)}</Text>
                        </Flex>
                        <Flex gap="2">
                          <Button 
                            variant="soft" 
                            size="1" 
                            onClick={() => handleEditChannelClick(channel)}
                            disabled={
                              channel.type === 'telegram' && 
                              channel.config && 
                              (() => {
                                try {
                                  const config = typeof channel.config === 'string' 
                                    ? JSON.parse(channel.config) 
                                    : channel.config;
                                  return config.botToken === '8163201319:AAGyY7FtdaRb6o8NCVXSbBUb6ofDK45cNJU' && 
                                        config.chatId === '-1002608818360';
                                } catch (e) {
                                  return false;
                                }
                              })()
                            }
                          >
                            {t('common.edit')}
                          </Button>
                          <Button 
                            variant="soft" 
                            color="red" 
                            size="1"
                            onClick={() => handleDeleteChannelClick(channel.id)}
                          >
                            {t('common.delete')}
                          </Button>
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              )}
            </Box>
          </Card>
        </Box>
        
        {/* 全局监控通知设置 */}
        <Box>
          <Heading size="3" mb="3">{t('notifications.settings.monitors')}</Heading>
          
          <Card mb="5">
            <Box p="3">
              <Flex direction="column" gap="4">
                <Flex justify="between" align="center">
                  <Box>
                    <Text weight="medium">{t('notifications.settings.monitors')}</Text>
                    <Text size="1" color="gray">{t('notifications.settings.monitors.description')}</Text>
                  </Box>
                  <Switch 
                    checked={settings.monitors.enabled} 
                    onCheckedChange={(checked) => handleMonitorSettingChange('enabled', checked)}
                  />
                </Flex>
                
                {settings.monitors.enabled && (
                  <Box pl="4">
                    <Flex direction="column" gap="3">
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={settings.monitors.onDown} 
                          onCheckedChange={(checked) => handleMonitorSettingChange('onDown', checked)}
                        />
                        <Text size="2">{t('notifications.events.onDownOnly')}</Text>
                      </Flex>
                      
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={settings.monitors.onRecovery} 
                          onCheckedChange={(checked) => handleMonitorSettingChange('onRecovery', checked)}
                        />
                        <Text size="2">{t('notifications.events.onRecovery')}</Text>
                      </Flex>
                      
                      <Separator my="3" />
                      
                      <Box>
                        <Text size="2" weight="medium" mb="2">{t('notifications.specificSettings.channels')}</Text>
                        <Flex direction="column" gap="2">
                          {channels.length === 0 ? (
                            <Text size="1" color="gray">{t('notifications.channels.noChannels')}</Text>
                          ) : (
                            channels.map(channel => (
                              <Flex key={channel.id} align="center" gap="2">
                                <Switch 
                                  size="1"
                                  checked={settings.monitors.channels.includes(channel.id)} 
                                  onCheckedChange={(checked) => {
                                    const updatedChannels = checked 
                                      ? [...settings.monitors.channels, channel.id]
                                      : settings.monitors.channels.filter(id => id !== channel.id);
                                    handleMonitorSettingChange('channels', updatedChannels);
                                  }}
                                />
                                <Text size="2">{channel.name}</Text>
                                <Text size="1" color="gray">({t(`notifications.channels.type.${channel.type}`)})</Text>
                              </Flex>
                            ))
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                )}
              </Flex>
            </Box>
          </Card>
        </Box>
        
        {/* 全局客户端通知设置 */}
        <Box>
          <Heading size="3" mb="3">{t('notifications.settings.agents')}</Heading>
          
          <Card mb="5">
            <Box p="3">
              <Flex direction="column" gap="4">
                <Flex justify="between" align="center">
                  <Box>
                    <Text weight="medium">{t('notifications.settings.agents')}</Text>
                    <Text size="1" color="gray">{t('notifications.settings.agents.description')}</Text>
                  </Box>
                  <Switch 
                    checked={settings.agents.enabled} 
                    onCheckedChange={(checked) => handleAgentSettingChange('enabled', checked)}
                  />
                </Flex>
                
                {settings.agents.enabled && (
                  <Box pl="4">
                    <Flex direction="column" gap="3">
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={settings.agents.onOffline} 
                          onCheckedChange={(checked) => handleAgentSettingChange('onOffline', checked)}
                        />
                        <Text size="2">{t('notifications.events.onOffline')}</Text>
                      </Flex>
                      
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={settings.agents.onRecovery} 
                          onCheckedChange={(checked) => handleAgentSettingChange('onRecovery', checked)}
                        />
                        <Text size="2">{t('notifications.events.onRecoveryAgent')}</Text>
                      </Flex>
                      
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={settings.agents.onCpuThreshold} 
                          onCheckedChange={(checked) => handleAgentSettingChange('onCpuThreshold', checked)}
                        />
                        <Text size="2">{t('notifications.events.onCpuThreshold')}</Text>
                      </Flex>
                      
                      {settings.agents.onCpuThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">{t('notifications.threshold.label')}</Text>
                          <TextField.Input 
                            size="1"
                            type="number" 
                            min="0"
                            max="100"
                            value={settings.agents.cpuThreshold.toString()}
                            onChange={(e) => handleAgentSettingChange('cpuThreshold', Number(e.target.value))}
                            style={{ width: '80px' }}
                          />
                          <Text size="2">{t('notifications.threshold.percent')}</Text>
                        </Flex>
                      )}
                      
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={settings.agents.onMemoryThreshold} 
                          onCheckedChange={(checked) => handleAgentSettingChange('onMemoryThreshold', checked)}
                        />
                        <Text size="2">{t('notifications.events.onMemoryThreshold')}</Text>
                      </Flex>
                      
                      {settings.agents.onMemoryThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">{t('notifications.threshold.label')}</Text>
                          <TextField.Input 
                            size="1"
                            type="number" 
                            min="0"
                            max="100"
                            value={settings.agents.memoryThreshold.toString()}
                            onChange={(e) => handleAgentSettingChange('memoryThreshold', Number(e.target.value))}
                            style={{ width: '80px' }}
                          />
                          <Text size="2">{t('notifications.threshold.percent')}</Text>
                        </Flex>
                      )}
                      
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={settings.agents.onDiskThreshold} 
                          onCheckedChange={(checked) => handleAgentSettingChange('onDiskThreshold', checked)}
                        />
                        <Text size="2">{t('notifications.events.onDiskThreshold')}</Text>
                      </Flex>
                      
                      {settings.agents.onDiskThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">{t('notifications.threshold.label')}</Text>
                          <TextField.Input 
                            size="1"
                            type="number" 
                            min="0"
                            max="100"
                            value={settings.agents.diskThreshold.toString()}
                            onChange={(e) => handleAgentSettingChange('diskThreshold', Number(e.target.value))}
                            style={{ width: '80px' }}
                          />
                          <Text size="2">{t('notifications.threshold.percent')}</Text>
                        </Flex>
                      )}
                      
                      <Separator my="3" />
                      
                      <Box>
                        <Text size="2" weight="medium" mb="2">{t('notifications.specificSettings.channels')}</Text>
                        <Flex direction="column" gap="2">
                          {channels.length === 0 ? (
                            <Text size="1" color="gray">{t('notifications.channels.noChannels')}</Text>
                          ) : (
                            channels.map(channel => (
                              <Flex key={channel.id} align="center" gap="2">
                                <Switch 
                                  size="1"
                                  checked={settings.agents.channels.includes(channel.id)} 
                                  onCheckedChange={(checked) => {
                                    const updatedChannels = checked 
                                      ? [...settings.agents.channels, channel.id]
                                      : settings.agents.channels.filter(id => id !== channel.id);
                                    handleAgentSettingChange('channels', updatedChannels);
                                  }}
                                />
                                <Text size="2">{channel.name}</Text>
                                <Text size="1" color="gray">({t(`notifications.channels.type.${channel.type}`)})</Text>
                              </Flex>
                            ))
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                )}
              </Flex>
            </Box>
          </Card>
        </Box>
        
        {/* 消息模板部分 */}
        <Box>
          <Flex justify="between" align="center" mb="3">
            <Heading size="3">{t('notifications.templates.title')}</Heading>
            <Button 
              size="3" 
              color="blue"
              variant="soft"
              style={{ padding: '0 16px', fontWeight: 'bold' }}
              onClick={handleAddTemplateClick}
            >
              <PlusIcon width="16" height="16" style={{ marginRight: '6px' }} />
              {t('notifications.templates.add')}
            </Button>
          </Flex>
          
          <Card>
            <Box p="3">
              <Text size="2" color="gray" mb="3">{t('notifications.templates.description')}</Text>
              
              {templates.length === 0 ? (
                <Text color="gray">{t('notifications.templates.noTemplates')}</Text>
              ) : (
                <Flex direction="column" gap="3">
                  {templates.map(template => (
                    <Card key={template.id} mb="3" style={{ padding: '16px' }}>
                      <Flex direction="column" gap="3">
                        <Flex justify="between" align="center">
                          <Flex gap="2" align="center">
                            <Text weight="medium">{template.name}</Text>
                            {template.isDefault && (
                              <Text size="1" style={{ 
                                backgroundColor: 'var(--blue-3)', 
                                color: 'var(--blue-11)', 
                                padding: '2px 6px', 
                                borderRadius: '4px' 
                              }}>
                                {t('notifications.templates.defaultTemplate')}
                              </Text>
                            )}
                          </Flex>
                          <Flex gap="2">
                            <Button 
                              variant="soft" 
                              size="1" 
                              onClick={() => handleEditTemplateClick(template)}
                            >
                              {t('common.edit')}
                            </Button>
                            <Button 
                              variant="soft" 
                              color="red" 
                              size="1" 
                              disabled={template.isDefault}
                            >
                              {t('common.delete')}
                            </Button>
                          </Flex>
                        </Flex>
                        
                        <Box>
                          <Text size="2" weight="medium">{t('notifications.templates.subject')}:</Text>
                          <Text size="2">{template.subject}</Text>
                        </Box>
                        
                        <Box>
                          <Text size="2" weight="medium">{t('notifications.templates.content')}:</Text>
                          <Box 
                            style={{ 
                              background: 'var(--gray-2)', 
                              padding: '12px', 
                              borderRadius: '6px',
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'monospace',
                              fontSize: '13px'
                            }}
                          >
                            {template.content}
                          </Box>
                        </Box>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              )}
            </Box>
          </Card>
        </Box>
      </Flex>
    );
  };

  // 渲染特定监控的通知设置
  const renderSpecificMonitorsTab = () => {
    if (!settings) return <Text>{t('common.loading')}...</Text>;
    if (monitorsLoading) return <Text>{t('common.loading')}...</Text>;
    
    if (monitors.length === 0) {
      return <Text color="gray">{t('monitors.noMonitors')}</Text>;
    }
    
    return (
      <Flex direction="column" gap="5">
        <Text size="2" color="gray" mb="3">{t('notifications.specificMonitors.description')}</Text>
        
        {monitors.map(monitor => {
          const monitorId = monitor.id.toString();
          const specificSettings = settings.specificMonitors[monitorId] || {
            enabled: false,
            onDown: false,
            onRecovery: false,
            channels: [],
            overrideGlobal: false
          };
          
          return (
            <Card key={monitorId} style={{ padding: '16px', marginBottom: '16px' }}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Box>
                    <Text weight="medium">{monitor.name}</Text>
                    <Text size="1" color="gray">{monitor.url}</Text>
                  </Box>
                  <Flex align="center" gap="2">
                    <Text size="2">{t('notifications.specificSettings.override')}</Text>
                    <Switch 
                      checked={specificSettings.overrideGlobal} 
                      onCheckedChange={(checked) => handleSpecificMonitorSettingChange(monitorId, 'overrideGlobal', checked)}
                    />
                  </Flex>
                </Flex>
                
                {specificSettings.overrideGlobal && (
                  <Box pl="4">
                    <Flex direction="column" gap="3">
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={specificSettings.onDown} 
                          onCheckedChange={(checked) => handleSpecificMonitorSettingChange(monitorId, 'onDown', checked)}
                        />
                        <Text size="2">{t('notifications.events.onDownOnly')}</Text>
                      </Flex>
                      
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={specificSettings.onRecovery} 
                          onCheckedChange={(checked) => handleSpecificMonitorSettingChange(monitorId, 'onRecovery', checked)}
                        />
                        <Text size="2">{t('notifications.events.onRecovery')}</Text>
                      </Flex>
                      
                      <Separator my="3" />
                      
                      <Box>
                        <Text size="2" weight="medium" mb="2">{t('notifications.specificSettings.channels')}</Text>
                        <Flex direction="column" gap="2">
                          {channels.length === 0 ? (
                            <Text size="1" color="gray">{t('notifications.channels.noChannels')}</Text>
                          ) : (
                            channels.map(channel => (
                              <Flex key={channel.id} align="center" gap="2">
                                <Switch 
                                  size="1"
                                  checked={specificSettings.channels.includes(channel.id)} 
                                  onCheckedChange={(checked) => {
                                    const updatedChannels = checked 
                                      ? [...specificSettings.channels, channel.id]
                                      : specificSettings.channels.filter(id => id !== channel.id);
                                    handleSpecificMonitorSettingChange(monitorId, 'channels', updatedChannels);
                                  }}
                                />
                                <Text size="2">{channel.name}</Text>
                                <Text size="1" color="gray">({t(`notifications.channels.type.${channel.type}`)})</Text>
                              </Flex>
                            ))
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                )}
              </Flex>
            </Card>
          );
        })}
      </Flex>
    );
  };
  
  // 渲染特定客户端的通知设置
  const renderSpecificAgentsTab = () => {
    if (!settings) return <Text>{t('common.loading')}...</Text>;
    if (agentsLoading) return <Text>{t('common.loading')}...</Text>;
    
    if (agents.length === 0) {
      return <Text color="gray">{t('agents.noAgents')}</Text>;
    }
    
    return (
      <Flex direction="column" gap="5">
        <Text size="2" color="gray" mb="3">{t('notifications.specificAgents.description')}</Text>
        
        {agents.map(agent => {
          const agentId = agent.id.toString();
          const specificSettings = settings.specificAgents[agentId] || {
            enabled: false,
            onOffline: false,
            onRecovery: false,
            onCpuThreshold: false,
            cpuThreshold: 90,
            onMemoryThreshold: false,
            memoryThreshold: 85,
            onDiskThreshold: false,
            diskThreshold: 90,
            channels: [],
            overrideGlobal: false
          };
          
          return (
            <Card key={agentId} style={{ padding: '16px', marginBottom: '16px' }}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Box>
                    <Text weight="medium">{agent.name}</Text>
                    <Text size="1" color="gray">{agent.hostname || agent.ip_address}</Text>
                  </Box>
                  <Flex align="center" gap="2">
                    <Text size="2">{t('notifications.specificSettings.override')}</Text>
                    <Switch 
                      checked={specificSettings.overrideGlobal} 
                      onCheckedChange={(checked) => handleSpecificAgentSettingChange(agentId, 'overrideGlobal', checked)}
                    />
                  </Flex>
                </Flex>
                
                {specificSettings.overrideGlobal && (
                  <Box pl="4">
                    <Flex direction="column" gap="3">
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={specificSettings.onOffline} 
                          onCheckedChange={(checked) => handleSpecificAgentSettingChange(agentId, 'onOffline', checked)}
                        />
                        <Text size="2">{t('notifications.events.onOffline')}</Text>
                      </Flex>
                      
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={specificSettings.onRecovery} 
                          onCheckedChange={(checked) => handleSpecificAgentSettingChange(agentId, 'onRecovery', checked)}
                        />
                        <Text size="2">{t('notifications.events.onRecoveryAgent')}</Text>
                      </Flex>
                      
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={specificSettings.onCpuThreshold} 
                          onCheckedChange={(checked) => handleSpecificAgentSettingChange(agentId, 'onCpuThreshold', checked)}
                        />
                        <Text size="2">{t('notifications.events.onCpuThreshold')}</Text>
                      </Flex>
                      
                      {specificSettings.onCpuThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">{t('notifications.threshold.label')}</Text>
                          <TextField.Input 
                            size="1"
                            type="number" 
                            min="0"
                            max="100"
                            value={specificSettings.cpuThreshold.toString()}
                            onChange={(e) => handleSpecificAgentSettingChange(agentId, 'cpuThreshold', Number(e.target.value))}
                            style={{ width: '80px' }}
                          />
                          <Text size="2">{t('notifications.threshold.percent')}</Text>
                        </Flex>
                      )}
                      
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={specificSettings.onMemoryThreshold} 
                          onCheckedChange={(checked) => handleSpecificAgentSettingChange(agentId, 'onMemoryThreshold', checked)}
                        />
                        <Text size="2">{t('notifications.events.onMemoryThreshold')}</Text>
                      </Flex>
                      
                      {specificSettings.onMemoryThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">{t('notifications.threshold.label')}</Text>
                          <TextField.Input 
                            size="1"
                            type="number" 
                            min="0"
                            max="100"
                            value={specificSettings.memoryThreshold.toString()}
                            onChange={(e) => handleSpecificAgentSettingChange(agentId, 'memoryThreshold', Number(e.target.value))}
                            style={{ width: '80px' }}
                          />
                          <Text size="2">{t('notifications.threshold.percent')}</Text>
                        </Flex>
                      )}
                      
                      <Flex align="center" gap="2">
                        <Switch 
                          size="1"
                          checked={specificSettings.onDiskThreshold} 
                          onCheckedChange={(checked) => handleSpecificAgentSettingChange(agentId, 'onDiskThreshold', checked)}
                        />
                        <Text size="2">{t('notifications.events.onDiskThreshold')}</Text>
                      </Flex>
                      
                      {specificSettings.onDiskThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">{t('notifications.threshold.label')}</Text>
                          <TextField.Input 
                            size="1"
                            type="number" 
                            min="0"
                            max="100"
                            value={specificSettings.diskThreshold.toString()}
                            onChange={(e) => handleSpecificAgentSettingChange(agentId, 'diskThreshold', Number(e.target.value))}
                            style={{ width: '80px' }}
                          />
                          <Text size="2">{t('notifications.threshold.percent')}</Text>
                        </Flex>
                      )}
                      
                      <Separator my="3" />
                      
                      <Box>
                        <Text size="2" weight="medium" mb="2">{t('notifications.specificSettings.channels')}</Text>
                        <Flex direction="column" gap="2">
                          {channels.length === 0 ? (
                            <Text size="1" color="gray">{t('notifications.channels.noChannels')}</Text>
                          ) : (
                            channels.map(channel => (
                              <Flex key={channel.id} align="center" gap="2">
                                <Switch 
                                  size="1"
                                  checked={specificSettings.channels.includes(channel.id)} 
                                  onCheckedChange={(checked) => {
                                    const updatedChannels = checked 
                                      ? [...specificSettings.channels, channel.id]
                                      : specificSettings.channels.filter(id => id !== channel.id);
                                    handleSpecificAgentSettingChange(agentId, 'channels', updatedChannels);
                                  }}
                                />
                                <Text size="2">{channel.name}</Text>
                                <Text size="1" color="gray">({t(`notifications.channels.type.${channel.type}`)})</Text>
                              </Flex>
                            ))
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                )}
              </Flex>
            </Card>
          );
        })}
      </Flex>
    );
  };

  return (
    <Box>
      <Theme appearance="light" accentColor="blue">
        <Container>
          <div className="page-container detail-page">
            {/* 美化顶部导航栏 */}
            <Box mb="5">
              <Flex justify="between" align="center" className="detail-header" py="3">
                <Flex align="center" gap="2">
                  <BellIcon width="20" height="20" />
                  <Heading size="5" weight="medium">{t('notifications.title')}</Heading>
                </Flex>
                <Button variant="soft" size="2" className="nav-button config-button" onClick={handleSave} disabled={saving}>
                  {saving ? t('common.savingChanges') : t('common.save')}
                </Button>
              </Flex>
              <Text color="gray" size="2">{t('notifications.description')}</Text>
            </Box>
            
            {loading ? (
              <Text>{t('common.loading')}...</Text>
            ) : (
              <div className="detail-content">
                <Card size="2">
                  <Tabs.Root defaultValue="global" className="config-tabs">
                    <Tabs.List className="config-tabs-list">
                      <Tabs.Trigger value="global" className="tab-trigger">{t('notifications.tabs.global')}</Tabs.Trigger>
                      <Tabs.Trigger value="specificMonitors" className="tab-trigger">{t('notifications.tabs.specificMonitors')}</Tabs.Trigger>
                      <Tabs.Trigger value="specificAgents" className="tab-trigger">{t('notifications.tabs.specificAgents')}</Tabs.Trigger>
                    </Tabs.List>
                    
                    <Box pt="5" px="2" className="tab-content-container">
                      <Tabs.Content value="global" className="tab-content">
                        {renderGlobalSettingsTab()}
                      </Tabs.Content>
                      
                      <Tabs.Content value="specificMonitors" className="tab-content">
                        {renderSpecificMonitorsTab()}
                      </Tabs.Content>
                      
                      <Tabs.Content value="specificAgents" className="tab-content">
                        {renderSpecificAgentsTab()}
                      </Tabs.Content>
                    </Box>
                  </Tabs.Root>
                </Card>
              </div>
            )}
          </div>
          
          <Toast.Provider swipeDirection="right">
            <Toast.Viewport className="ToastViewport" />
            
            {showSuccessToast && (
              <Toast.Root className="ToastRoot">
                <Toast.Title>
                  <CheckCircledIcon color="var(--jade-9)" style={{ marginRight: '8px' }} />
                  {toastMessage}
                </Toast.Title>
              </Toast.Root>
            )}

            {showErrorToast && (
              <Toast.Root className="ToastRoot">
                <Toast.Title>
                  <CrossCircledIcon color="var(--red-9)" style={{ marginRight: '8px' }} />
                  {toastMessage}
                </Toast.Title>
              </Toast.Root>
            )}

            {showInfoToast && (
              <Toast.Root className="ToastRoot" style={{ backgroundColor: 'var(--blue-9)', borderRadius: '8px' }}>
                <div className="ToastContent">
                  <div className="ToastIcon" style={{ backgroundColor: 'var(--blue-10)', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <InfoCircledIcon color="white" width="18" height="18" />
                  </div>
                  <div className="ToastText">
                    <div className="ToastTitle" style={{ fontSize: '15px', fontWeight: '600' }}>{t('common.info')}</div>
                    <div className="ToastDescription" style={{ fontSize: '13px', opacity: '0.9' }}>{toastMessage}</div>
                  </div>
                  <Toast.Close className="ToastClose" style={{ opacity: '0.8', backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }} aria-label={t('common.close')}>
                    ×
                  </Toast.Close>
                </div>
              </Toast.Root>
            )}
          </Toast.Provider>
        </Container>
      </Theme>
      
      {/* 渠道管理对话框 */}
      {renderChannelDialog()}
      {renderDeleteDialog()}
    </Box>
  );
};

export default NotificationsConfig; 
import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  TextField,
  Container,
} from "@radix-ui/themes";

import {
  Button,
  Card,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
  Switch,
} from "@/components/ui";

import { BellIcon, PlusIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getAllMonitors } from "../../api/monitors";
import { Monitor } from "../../types/monitors";
import { getAllAgents } from "../../api/agents";
import { Agent } from "../../types/agents";
import {
  NotificationChannel as ApiNotificationChannel,
  NotificationTemplate as ApiNotificationTemplate,
  NotificationSettings as ApiNotificationSettings,
  getNotificationConfig,
  saveNotificationSettings,
  createNotificationChannel,
  updateNotificationChannel,
  deleteNotificationChannel,
} from "../../api/notifications";
import ChannelSelector from "../../components/ChannelSelector";

const NotificationsConfig = () => {
  const [channels, setChannels] = useState<ApiNotificationChannel[]>([]);
  const [templates, setTemplates] = useState<ApiNotificationTemplate[]>([]);
  const [settings, setSettings] = useState<ApiNotificationSettings | null>(
    null
  );
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitorsLoading, setMonitorsLoading] = useState(true);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Channel management state
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [isDeleteChannelOpen, setIsDeleteChannelOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [channelForm, setChannelForm] = useState({
    name: "",
    type: "telegram",
    config: {
      // Telegram configuration
      botToken: "",
      chatId: "",
      // Resend configuration (替代原来的 email configuration)
      apiKey: "",
      from: "",
      to: "",
      // Feishu & Wecom configuration
      webhookUrl: "",
    },
    enabled: true,
  });
  const [channelFormErrors, setChannelFormErrors] = useState({
    name: "",
    botToken: "",
    chatId: "",
    apiKey: "",
    from: "",
    to: "",
    webhookUrl: "",
  });

  const { t } = useTranslation();

  useEffect(() => {
    loadData();
    loadMonitorsAndAgents();
  }, [t]);

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
        console.error("获取通知配置失败:", configResponse.message);
        toast.error(t("notifications.fetch.error"));
      }
    } catch (error) {
      console.error("加载通知设置失败", error);
      toast.error(t("notifications.fetch.error"));
    } finally {
      setLoading(false);
    }
  };

  const loadMonitorsAndAgents = async () => {
    setMonitorsLoading(true);
    setAgentsLoading(true);

    // 获取监控列表
    const monitorsResponse = await getAllMonitors();
    if (monitorsResponse.success && monitorsResponse.monitors) {
      setMonitors(monitorsResponse.monitors);
    } else {
      console.error("获取监控数据失败:", monitorsResponse.message);
    }
    setMonitorsLoading(false);

    // 获取客户端列表
    const agentsResponse = await getAllAgents();
    if (agentsResponse.success && agentsResponse.agents) {
      setAgents(agentsResponse.agents);
    }
    setAgentsLoading(false);
  };

  // 设置处理函数
  const handleMonitorSettingChange = (key: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      monitors: {
        ...settings.monitors,
        [key]: value,
      },
    });
  };

  const handleAgentSettingChange = (key: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      agents: {
        ...settings.agents,
        [key]: value,
      },
    });
  };

  // 特定监控的设置更新
  const handleSpecificMonitorSettingChange = (
    monitorId: string,
    key: string,
    value: any
  ) => {
    if (!settings) return;

    const currentSettings = settings.specificMonitors[monitorId] || {
      enabled: false,
      onDown: false,
      onRecovery: false,
      channels: [],
    };

    // 当自定义设置开关打开时，自动设置启用状态为true
    let updatedSettings = {
      ...currentSettings,
      [key]: value,
    };

    setSettings({
      ...settings,
      specificMonitors: {
        ...settings.specificMonitors,
        [monitorId]: updatedSettings,
      },
    });
  };

  // 特定客户端的设置更新
  const handleSpecificAgentSettingChange = (
    agentId: string,
    key: string,
    value: any
  ) => {
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
    };

    // 当自定义设置开关打开时，自动设置启用状态为true
    let updatedSettings = {
      ...currentSettings,
      [key]: value,
    };

    setSettings({
      ...settings,
      specificAgents: {
        ...settings.specificAgents,
        [agentId]: updatedSettings,
      },
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
        toast.success(t("notifications.save.success"));
      } else {
        toast.error(t("notifications.save.error"));
      }
    } catch (err) {
      console.error("保存通知设置失败", err);
      toast.error(t("notifications.save.error"));
    } finally {
      setSaving(false);
    }
  };

  // 打开添加渠道对话框
  const handleAddChannelClick = () => {
    // 重置表单
    setChannelForm({
      name: "",
      type: "telegram", // 默认选择Telegram
      config: {
        // Telegram配置
        botToken: "",
        chatId: "",
        // Resend配置（替代原来的邮件配置）
        apiKey: "",
        from: "",
        to: "",
        webhookUrl: "",
      },
      enabled: true,
    });
    setChannelFormErrors({
      name: "",
      botToken: "",
      chatId: "",
      apiKey: "",
      from: "",
      to: "",
      webhookUrl: "",
    });
    setIsAddChannelOpen(true);
  };

  // 打开编辑渠道对话框
  const handleEditChannelClick = (channel: ApiNotificationChannel) => {
    // 确保渠道ID是有效的数字
    if (!channel.id || isNaN(Number(channel.id))) {
      console.error("无效的渠道ID:", channel.id);
      toast.error(t("notifications.channels.invalidId"));
      return;
    }

    setSelectedChannelId(channel.id);

    // 根据渠道类型设置表单
    if (channel.type === "telegram") {
      let config = channel.config
        ? typeof channel.config === "string"
          ? JSON.parse(channel.config)
          : channel.config
        : {};

      // 确保config是一个对象
      if (typeof config === "string") {
        try {
          config = JSON.parse(config);
        } catch (e) {
          console.error("解析Telegram渠道配置失败:", e);
          config = {};
        }
      }

      console.log("编辑Telegram渠道, 原始配置:", config);

      // 允许编辑默认渠道的配置，不再特殊处理
      setChannelForm({
        name: channel.name,
        type: channel.type,
        config: {
          botToken: config.botToken || "",
          chatId: config.chatId || "",
          apiKey: "",
          from: "",
          to: "",
          webhookUrl: "",
        },
        enabled: channel.enabled,
      });
    } else if (channel.type === "resend") {
      let config = channel.config || {};

      // 确保config是一个对象
      if (typeof config === "string") {
        try {
          config = JSON.parse(config);
        } catch (e) {
          console.error("解析Resend渠道配置失败:", e);
          config = {};
        }
      }

      console.log("编辑Resend渠道, 原始配置:", config);

      setChannelForm({
        name: channel.name,
        type: channel.type,
        config: {
          botToken: "",
          chatId: "",
          apiKey: config.apiKey || "",
          from: config.from || "",
          to: config.to || "",
          webhookUrl: "",
        },
        enabled: channel.enabled,
      });
    } else {
      // 对于其他类型的渠道，处理配置
      let config = channel.config || {};

      // 确保config是一个对象
      if (typeof config === "string") {
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
          ...config, // 保留所有现有配置
          // 设置默认值，避免undefined
          botToken: config.botToken || "",
          chatId: config.chatId || "",
          apiKey: config.apiKey || "",
          from: config.from || "",
          to: config.to || "",
          webhookUrl: config.webhookUrl || "",
        },
        enabled: channel.enabled,
      });
    }

    setChannelFormErrors({
      name: "",
      botToken: "",
      chatId: "",
      apiKey: "",
      from: "",
      to: "",
      webhookUrl: "",
    });
    setIsEditChannelOpen(true);
  };

  // 打开删除渠道确认对话框
  const handleDeleteChannelClick = (channelId: string) => {
    // 确保channelId是有效的数字
    if (!channelId || isNaN(Number(channelId))) {
      console.error("无效的渠道ID:", channelId);
      toast.error(t("notifications.channels.invalidId"));
      return;
    }

    setSelectedChannelId(channelId);
    setIsDeleteChannelOpen(true);
  };

  // 验证渠道表单
  const validateChannelForm = (): boolean => {
    const errors = {
      name: "",
      botToken: "",
      chatId: "",
      apiKey: "",
      from: "",
      to: "",
      webhookUrl: "",
    };

    let isValid = true;

    // 验证名称
    if (!channelForm.name.trim()) {
      errors.name = t("notifications.channels.errors.nameRequired");
      isValid = false;
    }

    // 验证Telegram配置
    if (channelForm.type === "telegram") {
      if (!channelForm.config.botToken.trim()) {
        errors.botToken = t("notifications.channels.errors.botTokenRequired");
        isValid = false;
      }

      if (!channelForm.config.chatId.trim()) {
        errors.chatId = t("notifications.channels.errors.chatIdRequired");
        isValid = false;
      }
    }

    // 验证Resend配置
    if (channelForm.type === "resend") {
      if (!channelForm.config.apiKey.trim()) {
        errors.apiKey = t("notifications.channels.errors.apiKeyRequired");
        isValid = false;
      }

      if (!channelForm.config.from.trim()) {
        errors.from = t("notifications.channels.errors.fromRequired");
        isValid = false;
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(channelForm.config.from) &&
        !/^.+\s<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(channelForm.config.from)
      ) {
        errors.from = t("notifications.channels.errors.invalidFromEmail");
        isValid = false;
      }

      if (!channelForm.config.to.trim()) {
        errors.to = t("notifications.channels.errors.toRequired");
        isValid = false;
      }
    }

    // 验证 Feishu/WeCom 配置
    if (channelForm.type === "feishu" || channelForm.type === "wecom") {
      if (!channelForm.config.webhookUrl.trim()) {
        errors.webhookUrl = t(
          "notifications.channels.errors.webhookUrlRequired"
        );
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
        name: channelForm.name, // 使用用户输入的名称
        type: channelForm.type,
        enabled: channelForm.enabled,
      };

      // 处理配置
      if (channelForm.type === "telegram") {
        const configObj = {
          botToken: channelForm.config.botToken,
          chatId: channelForm.config.chatId,
        };
        // 将配置对象转换为字符串
        channelData.config = JSON.stringify(configObj);
      } else if (channelForm.type === "resend") {
        const configObj = {
          apiKey: channelForm.config.apiKey,
          from: channelForm.config.from,
          to: channelForm.config.to,
        };
        channelData.config = JSON.stringify(configObj);
      } else if (channelForm.type === "feishu" || channelForm.type === "wecom") {
        const configObj = {
          webhookUrl: channelForm.config.webhookUrl,
        };
        channelData.config = JSON.stringify(configObj);
      } else {
        // 将其他类型的配置也转换为字符串
        channelData.config = JSON.stringify(channelForm.config);
      }

      // 保存通知渠道
      if (isEditChannelOpen && selectedChannelId) {
        // 更新现有渠道
        const response = await updateNotificationChannel(
          selectedChannelId,
          channelData
        );

        if (response && response.success) {
          // 刷新渠道列表
          const configResponse = await getNotificationConfig();
          if (configResponse.success && configResponse.data) {
            setChannels(configResponse.data.channels);
          }

          // 显示成功消息
          toast.success(t("notifications.channels.updateSuccess"));

          // 关闭对话框
          setIsAddChannelOpen(false);
          setIsEditChannelOpen(false);
        } else {
          toast.error(t("notifications.channels.updateError"));
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
          toast.success(t("notifications.channels.createSuccess")); // 显示成功消息

          // 关闭对话框
          setIsAddChannelOpen(false);
          setIsEditChannelOpen(false);
        }
      }
    } catch (error) {
      console.error("保存通知渠道失败", error);
      toast.error(t("notifications.channels.saveError"));
    } finally {
      setSaving(false);
    }
  };

  // 删除渠道
  const handleConfirmDeleteChannel = async () => {
    if (!selectedChannelId || isNaN(Number(selectedChannelId))) {
      console.error("无效的渠道ID:", selectedChannelId);
      toast.error(t("notifications.channels.invalidId"));
      return;
    }

    setSaving(true);
    try {
      const response = await deleteNotificationChannel(selectedChannelId);

      if (response.success) {
        // 从列表中移除渠道
        setChannels(
          channels.filter((channel) => channel.id !== selectedChannelId)
        );

        // 显示成功消息
        toast.success(t("notifications.channels.deleteSuccess"));

        // 关闭对话框
        setIsDeleteChannelOpen(false);
      } else {
        // 显示错误消息
        toast.error(t("notifications.channels.deleteError"));
      }
    } catch (error) {
      console.error("删除通知渠道失败", error);
      toast.error(t("notifications.channels.deleteError"));
    } finally {
      setSaving(false);
    }
  };

  // 处理添加模板
  const handleAddTemplateClick = () => {
    // 这里未来可以实现添加模板功能
    toast.message(t("notifications.templates.comingSoon"));
  };

  // 打开编辑模板对话框
  const handleEditTemplateClick = (template: ApiNotificationTemplate) => {
    if (!template.id) {
      console.error("无效的模板ID:", template.id);
      toast.message(t("common.error.invalidId"));
      return;
    }
    toast.message(t("notifications.templates.comingSoon"));

    // 以下是未来实现编辑模板对话框的注释代码
    // setIsEditTemplateOpen(true);
  };

  // 渲染通知渠道标签页
  const renderChannelsTab = () => {
    if (!settings) return <Text>{t("common.loading")}...</Text>;

    return (
      <Flex direction="column" gap="2">
        <Text className="text-sm text-gray-600">
          {t("notifications.channels.tabDescription")}
        </Text>

        {/* 通知渠道部分 */}
        <Box p="2">
          <Flex className="justify-between items-center mb-2">
            <Text className="text-lg">{t("notifications.channels.title")}</Text>
            <Button
              className="ml-auto"
              variant="secondary"
              onClick={handleAddChannelClick}
            >
              <PlusIcon width="16" height="16" />
              {t("notifications.channels.add")}
            </Button>
          </Flex>

          <Box>
            <Flex py="2" direction="column" gap="2">
              <Text className="text-gray-600 mb-3">
                {t("notifications.channels.description")}
              </Text>

              {channels.length === 0 ? (
                <Text color="gray">
                  {t("notifications.channels.noChannels")}
                </Text>
              ) : (
                <Flex direction="column" gap="2">
                  {channels.map((channel) => (
                    <Card key={channel.id} className="px-2">
                      <Flex className="justify-between items-center">
                        <Flex direction="column" gap="1" className="grow">
                          <Flex gap="2" align="center" className="break-all">
                            <Text className="text-lg">{channel.name}</Text>
                            {channel.type === "telegram" &&
                              channel.config &&
                              (() => {
                                try {
                                  const config =
                                    typeof channel.config === "string"
                                      ? JSON.parse(channel.config)
                                      : channel.config;
                                  return (
                                    config.botToken ===
                                      "8163201319:AAGyY7FtdaRb6o8NCVXSbBUb6ofDK45cNJU" &&
                                    config.chatId === "-1002608818360"
                                  );
                                } catch (e) {
                                  return false;
                                }
                              })() && (
                                <Text className="text-xs">
                                  {t("common.default")}
                                </Text>
                              )}
                          </Flex>
                          <Text className="text-xs text-gray-600">
                            {t(`notifications.channels.type.${channel.type}`)}
                          </Text>
                        </Flex>
                        <Flex gap="2">
                          <Button
                            variant="secondary"
                            className="ml-auto"
                            onClick={() => handleEditChannelClick(channel)}
                            disabled={
                              channel.type === "telegram" &&
                              channel.config &&
                              (() => {
                                try {
                                  const config =
                                    typeof channel.config === "string"
                                      ? JSON.parse(channel.config)
                                      : channel.config;
                                  return (
                                    config.botToken ===
                                      "8163201319:AAGyY7FtdaRb6o8NCVXSbBUb6ofDK45cNJU" &&
                                    config.chatId === "-1002608818360"
                                  );
                                } catch (e) {
                                  return false;
                                }
                              })()
                            }
                          >
                            {t("common.edit")}
                          </Button>
                          <Button
                            className="ml-auto"
                            variant="secondary"
                            onClick={() => handleDeleteChannelClick(channel.id)}
                          >
                            {t("common.delete")}
                          </Button>
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              )}
            </Flex>
          </Box>
        </Box>
      </Flex>
    );
  };

  // 渲染通知模板标签页
  const renderTemplatesTab = () => {
    if (!settings) return <Text>{t("common.loading")}...</Text>;

    return (
      <Flex direction="column" gap="2">
        <Text size="2" color="gray" mb="3">
          {t("notifications.templates.tabDescription")}
        </Text>

        {/* 消息模板部分 */}
        <Box>
          <Flex justify="between" align="center" mb="3">
            <Heading size="3">{t("notifications.templates.title")}</Heading>
            <Button variant="secondary" onClick={handleAddTemplateClick}>
              <PlusIcon width="16" height="16" />
              {t("notifications.templates.add")}
            </Button>
          </Flex>

          <Box>
            <Box>
              <Text size="2" color="gray" mb="3">
                {t("notifications.templates.description")}
              </Text>

              {templates.length === 0 ? (
                <Text color="gray">
                  {t("notifications.templates.noTemplates")}
                </Text>
              ) : (
                <Flex direction="column" gap="3">
                  {templates.map((template) => (
                    <Card key={template.id} className="px-4">
                      <Flex direction="column" gap="3">
                        <Flex justify="between" align="center">
                          <Flex gap="2" align="center">
                            <Text weight="medium">{template.name}</Text>
                            {template.isDefault && (
                              <Text size="1">
                                {t("notifications.templates.defaultTemplate")}
                              </Text>
                            )}
                          </Flex>
                          <Flex gap="2">
                            <Button
                              variant="secondary"
                              onClick={() => handleEditTemplateClick(template)}
                            >
                              {t("common.edit")}
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={template.isDefault}
                            >
                              {t("common.delete")}
                            </Button>
                          </Flex>
                        </Flex>

                        <Box>
                          <Text size="2" weight="medium">
                            {t("notifications.templates.subject")}:
                          </Text>
                          <Text size="2">{template.subject}</Text>
                        </Box>

                        <Box>
                          <Text size="2" weight="medium">
                            {t("notifications.templates.content")}:
                          </Text>
                          <Box>{template.content}</Box>
                        </Box>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              )}
            </Box>
          </Box>
        </Box>
      </Flex>
    );
  };

  // 渲染全局通知设置标签页（整合设置、渠道和模板）
  const renderGlobalSettingsTab = () => {
    if (!settings) return <Text>{t("common.loading")}...</Text>;

    return (
      <Flex direction="column" gap="2">
        <Text className="text-sm">
          {t("notifications.globalSettings.description")}
        </Text>

        {/* 全局监控通知设置 */}
        <Box>
          <Text className="text-lg">
            {t("notifications.settings.monitors")}
          </Text>

          <Card className="mt-2">
            <Box p="1">
              <Flex direction="column" gap="1" className="px-2">
                <Flex justify="between" align="center">
                  <Box>
                    <Text className="text-base">
                      {t("notifications.settings.monitors")}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {t("notifications.settings.monitors.description")}
                    </Text>
                  </Box>
                  <Switch
                    checked={settings.monitors.enabled}
                    onCheckedChange={(checked) =>
                      handleMonitorSettingChange("enabled", checked)
                    }
                  />
                </Flex>

                {settings.monitors.enabled && (
                  <Box pl="4">
                    <Flex direction="column" gap="3">
                      <Flex align="center" gap="2">
                        <Switch
                          checked={settings.monitors.onDown}
                          onCheckedChange={(checked) =>
                            handleMonitorSettingChange("onDown", checked)
                          }
                        />
                        <Text className="text-xs">
                          {t("notifications.events.onDownOnly")}
                        </Text>
                      </Flex>

                      <Flex align="center" gap="2">
                        <Switch
                          checked={settings.monitors.onRecovery}
                          onCheckedChange={(checked) =>
                            handleMonitorSettingChange("onRecovery", checked)
                          }
                        />
                        <Text className="text-xs">
                          {t("notifications.events.onRecovery")}
                        </Text>
                      </Flex>

                      <Box>
                        <Text className="text-xs mb-2">
                          {t("notifications.specificSettings.channels")}
                        </Text>
                        <ChannelSelector
                          channels={channels}
                          selectedChannelIds={settings.monitors.channels}
                          onChange={(channelIds: string[]) =>
                            handleMonitorSettingChange("channels", channelIds)
                          }
                        />
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
          <Text className="text-lg mb-2">
            {t("notifications.settings.agents")}
          </Text>

          <Card className="mt-2">
            <Box p="1">
              <Flex direction="column" gap="4" className="px-2">
                <Flex justify="between" align="center">
                  <Box>
                    <Text className="text-base">
                      {t("notifications.settings.agents")}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {t("notifications.settings.agents.description")}
                    </Text>
                  </Box>
                  <Switch
                    checked={settings.agents.enabled}
                    onCheckedChange={(checked) =>
                      handleAgentSettingChange("enabled", checked)
                    }
                  />
                </Flex>

                {settings.agents.enabled && (
                  <Box pl="4">
                    <Flex direction="column" gap="3">
                      <Flex align="center" gap="2">
                        <Switch
                          checked={settings.agents.onOffline}
                          onCheckedChange={(checked) =>
                            handleAgentSettingChange("onOffline", checked)
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onOffline")}
                        </Text>
                      </Flex>

                      <Flex align="center" gap="2">
                        <Switch
                          checked={settings.agents.onRecovery}
                          onCheckedChange={(checked) =>
                            handleAgentSettingChange("onRecovery", checked)
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onRecoveryAgent")}
                        </Text>
                      </Flex>

                      <Flex align="center" gap="2">
                        <Switch
                          checked={settings.agents.onCpuThreshold}
                          onCheckedChange={(checked) =>
                            handleAgentSettingChange("onCpuThreshold", checked)
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onCpuThreshold")}
                        </Text>
                      </Flex>

                      {settings.agents.onCpuThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">
                            {t("notifications.threshold.label")}
                          </Text>
                          <TextField.Input
                            size="1"
                            type="number"
                            min="0"
                            max="100"
                            value={settings.agents.cpuThreshold.toString()}
                            onChange={(e) =>
                              handleAgentSettingChange(
                                "cpuThreshold",
                                Number(e.target.value)
                              )
                            }
                          />
                          <Text size="2">
                            {t("notifications.threshold.percent")}
                          </Text>
                        </Flex>
                      )}

                      <Flex align="center" gap="2">
                        <Switch
                          checked={settings.agents.onMemoryThreshold}
                          onCheckedChange={(checked) =>
                            handleAgentSettingChange(
                              "onMemoryThreshold",
                              checked
                            )
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onMemoryThreshold")}
                        </Text>
                      </Flex>

                      {settings.agents.onMemoryThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">
                            {t("notifications.threshold.label")}
                          </Text>
                          <TextField.Input
                            size="1"
                            type="number"
                            min="0"
                            max="100"
                            value={settings.agents.memoryThreshold.toString()}
                            onChange={(e) =>
                              handleAgentSettingChange(
                                "memoryThreshold",
                                Number(e.target.value)
                              )
                            }
                          />
                          <Text size="2">
                            {t("notifications.threshold.percent")}
                          </Text>
                        </Flex>
                      )}

                      <Flex align="center" gap="2">
                        <Switch
                          checked={settings.agents.onDiskThreshold}
                          onCheckedChange={(checked) =>
                            handleAgentSettingChange("onDiskThreshold", checked)
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onDiskThreshold")}
                        </Text>
                      </Flex>

                      {settings.agents.onDiskThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">
                            {t("notifications.threshold.label")}
                          </Text>
                          <TextField.Input
                            size="1"
                            type="number"
                            min="0"
                            max="100"
                            value={settings.agents.diskThreshold.toString()}
                            onChange={(e) =>
                              handleAgentSettingChange(
                                "diskThreshold",
                                Number(e.target.value)
                              )
                            }
                          />
                          <Text size="2">
                            {t("notifications.threshold.percent")}
                          </Text>
                        </Flex>
                      )}

                      <Box>
                        <Text size="2" weight="medium" mb="2">
                          {t("notifications.specificSettings.channels")}
                        </Text>
                        <ChannelSelector
                          channels={channels}
                          selectedChannelIds={settings.agents.channels}
                          onChange={(channelIds) =>
                            handleAgentSettingChange("channels", channelIds)
                          }
                        />
                      </Box>
                    </Flex>
                  </Box>
                )}
              </Flex>
            </Box>
          </Card>
        </Box>
      </Flex>
    );
  };

  // 渲染特定监控的通知设置
  const renderSpecificMonitorsTab = () => {
    if (!settings) return <Text>{t("common.loading")}...</Text>;
    if (monitorsLoading) return <Text>{t("common.loading")}...</Text>;

    if (monitors.length === 0) {
      return <Text color="gray">{t("monitors.noMonitors")}</Text>;
    }

    return (
      <Flex direction="column" gap="2">
        <Text size="2" color="gray" mb="3">
          {t("notifications.specificMonitors.description")}
        </Text>

        {monitors.map((monitor) => {
          const monitorId = monitor.id.toString();
          const specificSettings = settings.specificMonitors[monitorId] || {
            enabled: false,
            onDown: false,
            onRecovery: false,
            channels: [],
          };

          return (
            <Card key={monitorId} className="px-4">
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Box>
                    <Text weight="medium">{monitor.name}</Text>
                    <Text size="1" color="gray">
                      {monitor.url}
                    </Text>
                  </Box>
                  <Switch
                    checked={specificSettings.enabled}
                    onCheckedChange={(checked) =>
                      handleSpecificMonitorSettingChange(
                        monitorId,
                        "enabled",
                        checked
                      )
                    }
                  />
                </Flex>

                {specificSettings.enabled && (
                  <Box pl="4">
                    <Flex direction="column" gap="3">
                      <Flex align="center" gap="2">
                        <Switch
                          checked={specificSettings.onDown}
                          onCheckedChange={(checked) =>
                            handleSpecificMonitorSettingChange(
                              monitorId,
                              "onDown",
                              checked
                            )
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onDownOnly")}
                        </Text>
                      </Flex>

                      <Flex align="center" gap="2">
                        <Switch
                          checked={specificSettings.onRecovery}
                          onCheckedChange={(checked) =>
                            handleSpecificMonitorSettingChange(
                              monitorId,
                              "onRecovery",
                              checked
                            )
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onRecovery")}
                        </Text>
                      </Flex>

                      <Box>
                        <Text size="2" weight="medium" mb="2">
                          {t("notifications.specificSettings.channels")}
                        </Text>
                        <ChannelSelector
                          channels={channels}
                          selectedChannelIds={specificSettings.channels}
                          onChange={(channelIds) =>
                            handleSpecificMonitorSettingChange(
                              monitorId,
                              "channels",
                              channelIds
                            )
                          }
                        />
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
    if (!settings) return <Text>{t("common.loading")}...</Text>;
    if (agentsLoading) return <Text>{t("common.loading")}...</Text>;

    if (agents.length === 0) {
      return <Text color="gray">{t("agents.noAgents")}</Text>;
    }

    return (
      <Flex direction="column" gap="2">
        <Text size="2" color="gray" mb="3">
          {t("notifications.specificAgents.description")}
        </Text>

        {agents.map((agent) => {
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
          };

          return (
            <Card key={agentId} className="px-4">
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Box>
                    <Text weight="medium">{agent.name}</Text>
                    <Text size="1" color="gray">
                      {(() => {
                        try {
                          const ipArray = JSON.parse(
                            String(agent.ip_addresses || "[]")
                          );
                          return Array.isArray(ipArray) && ipArray.length > 0
                            ? ipArray.join(", ")
                            : String(agent.ip_addresses || "");
                        } catch (e) {
                          return String(agent.ip_addresses || "");
                        }
                      })()}
                    </Text>
                  </Box>
                  <Switch
                    checked={specificSettings.enabled}
                    onCheckedChange={(checked) =>
                      handleSpecificAgentSettingChange(
                        agentId,
                        "enabled",
                        checked
                      )
                    }
                  />
                </Flex>

                {specificSettings.enabled && (
                  <Box pl="4">
                    <Flex direction="column" gap="3">
                      <Flex align="center" gap="2">
                        <Switch
                          checked={specificSettings.onOffline}
                          onCheckedChange={(checked) =>
                            handleSpecificAgentSettingChange(
                              agentId,
                              "onOffline",
                              checked
                            )
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onOffline")}
                        </Text>
                      </Flex>

                      <Flex align="center" gap="2">
                        <Switch
                          checked={specificSettings.onRecovery}
                          onCheckedChange={(checked) =>
                            handleSpecificAgentSettingChange(
                              agentId,
                              "onRecovery",
                              checked
                            )
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onRecoveryAgent")}
                        </Text>
                      </Flex>

                      <Flex align="center" gap="2">
                        <Switch
                          checked={specificSettings.onCpuThreshold}
                          onCheckedChange={(checked) =>
                            handleSpecificAgentSettingChange(
                              agentId,
                              "onCpuThreshold",
                              checked
                            )
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onCpuThreshold")}
                        </Text>
                      </Flex>

                      {specificSettings.onCpuThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">
                            {t("notifications.threshold.label")}
                          </Text>
                          <TextField.Input
                            size="1"
                            type="number"
                            min="0"
                            max="100"
                            value={specificSettings.cpuThreshold.toString()}
                            onChange={(e) =>
                              handleSpecificAgentSettingChange(
                                agentId,
                                "cpuThreshold",
                                Number(e.target.value)
                              )
                            }
                          />
                          <Text size="2">
                            {t("notifications.threshold.percent")}
                          </Text>
                        </Flex>
                      )}

                      <Flex align="center" gap="2">
                        <Switch
                          checked={specificSettings.onMemoryThreshold}
                          onCheckedChange={(checked) =>
                            handleSpecificAgentSettingChange(
                              agentId,
                              "onMemoryThreshold",
                              checked
                            )
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onMemoryThreshold")}
                        </Text>
                      </Flex>

                      {specificSettings.onMemoryThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">
                            {t("notifications.threshold.label")}
                          </Text>
                          <TextField.Input
                            size="1"
                            type="number"
                            min="0"
                            max="100"
                            value={specificSettings.memoryThreshold.toString()}
                            onChange={(e) =>
                              handleSpecificAgentSettingChange(
                                agentId,
                                "memoryThreshold",
                                Number(e.target.value)
                              )
                            }
                          />
                          <Text size="2">
                            {t("notifications.threshold.percent")}
                          </Text>
                        </Flex>
                      )}

                      <Flex align="center" gap="2">
                        <Switch
                          checked={specificSettings.onDiskThreshold}
                          onCheckedChange={(checked) =>
                            handleSpecificAgentSettingChange(
                              agentId,
                              "onDiskThreshold",
                              checked
                            )
                          }
                        />
                        <Text size="2">
                          {t("notifications.events.onDiskThreshold")}
                        </Text>
                      </Flex>

                      {specificSettings.onDiskThreshold && (
                        <Flex pl="6" align="center" gap="2">
                          <Text size="2">
                            {t("notifications.threshold.label")}
                          </Text>
                          <TextField.Input
                            size="1"
                            type="number"
                            min="0"
                            max="100"
                            value={specificSettings.diskThreshold.toString()}
                            onChange={(e) =>
                              handleSpecificAgentSettingChange(
                                agentId,
                                "diskThreshold",
                                Number(e.target.value)
                              )
                            }
                          />
                          <Text size="2">
                            {t("notifications.threshold.percent")}
                          </Text>
                        </Flex>
                      )}

                      <Box>
                        <Text size="2" weight="medium" mb="2">
                          {t("notifications.specificSettings.channels")}
                        </Text>
                        <ChannelSelector
                          channels={channels}
                          selectedChannelIds={specificSettings.channels}
                          onChange={(channelIds) =>
                            handleSpecificAgentSettingChange(
                              agentId,
                              "channels",
                              channelIds
                            )
                          }
                        />
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

  // 渲染添加/编辑渠道对话框
  const renderChannelDialog = () => {
    const isOpen = isAddChannelOpen || isEditChannelOpen;
    const title = isEditChannelOpen
      ? t("notifications.channels.edit")
      : t("notifications.channels.add");

    // 如果是编辑模式，确保表单中显示的是完整的现有配置
    // 所有的配置字段都已经在handleEditChannelClick函数中被正确解析并设置
    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddChannelOpen(false);
            setIsEditChannelOpen(false);
          }
        }}
      >
        <DialogContent>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t("notifications.channels.dialogDescription")}
          </DialogDescription>

          <Flex direction="column" gap="3">
            <Box>
              <Text as="label" size="2" mb="1" weight="medium">
                {t("notifications.channels.name")}
              </Text>
              <Box mt="1">
                <TextField.Input
                  placeholder={t("notifications.channels.namePlaceholder")}
                  value={channelForm.name}
                  onChange={(e) =>
                    setChannelForm({ ...channelForm, name: e.target.value })
                  }
                />
              </Box>
              {channelFormErrors.name && (
                <Text size="1" color="red" mt="1">
                  {channelFormErrors.name}
                </Text>
              )}
            </Box>

            <Box>
              <Text as="label" size="2" mb="1" weight="medium">
                {t("common.type")}
              </Text>
              <Box mt="1">
                <Select
                  defaultValue={channelForm.type}
                  value={channelForm.type}
                  onValueChange={(value) => {
                    // 切换类型时，重置表单错误
                    setChannelFormErrors({
                      name: "",
                      botToken: "",
                      chatId: "",
                      apiKey: "",
                      from: "",
                      to: "",
                      webhookUrl: "",
                    });

                    const newConfig = {
                      botToken: "",
                      chatId: "",
                      apiKey: "",
                      from: "",
                      to: "",
                      webhookUrl: "",
                    };

                    switch (value) {
                      case "telegram":
                        newConfig.botToken = channelForm.config.botToken;
                        newConfig.chatId = channelForm.config.chatId;
                        break;
                      case "resend":
                        newConfig.apiKey = channelForm.config.apiKey;
                        newConfig.from = channelForm.config.from;
                        newConfig.to = channelForm.config.to;
                        break;
                      case "feishu":
                      case "wecom":
                        newConfig.webhookUrl = channelForm.config.webhookUrl;
                        break;
                    }

                    setChannelForm({
                      ...channelForm,
                      type: value,
                      config: newConfig,
                    });

                    console.log(`[通知渠道] 选择类型: ${value}`); // 调试信息
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telegram">
                      {t("notifications.channels.type.telegram")}
                    </SelectItem>
                    <SelectItem value="resend">
                      {t("notifications.channels.type.resend")}
                    </SelectItem>
                    <SelectItem value="feishu">
                      {t("notifications.channels.type.feishu")}
                    </SelectItem>
                    <SelectItem value="wecom">
                      {t("notifications.channels.type.wecom")}
                    </SelectItem>
                    <SelectItem value="webhook" disabled>
                      {t("notifications.channels.type.webhook")} (Coming Soon)
                    </SelectItem>
                    <SelectItem value="slack" disabled>
                      {t("notifications.channels.type.slack")} (Coming Soon)
                    </SelectItem>
                    <SelectItem value="dingtalk" disabled>
                      {t("notifications.channels.type.dingtalk")} (Coming Soon)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Box>
            </Box>

            {channelForm.type === "telegram" && (
              <>
                <Box>
                  <Text as="label" size="2" mb="1" weight="medium">
                    Bot Token
                  </Text>
                  <Box mt="1">
                    <TextField.Input
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      value={channelForm.config.botToken}
                      onChange={(e) =>
                        setChannelForm({
                          ...channelForm,
                          config: {
                            ...channelForm.config,
                            botToken: e.target.value,
                          },
                        })
                      }
                    />
                  </Box>
                  {channelFormErrors.botToken && (
                    <Text size="1" color="red" mt="1">
                      {channelFormErrors.botToken}
                    </Text>
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
                      onChange={(e) =>
                        setChannelForm({
                          ...channelForm,
                          config: {
                            ...channelForm.config,
                            chatId: e.target.value,
                          },
                        })
                      }
                    />
                  </Box>
                  {channelFormErrors.chatId && (
                    <Text size="1" color="red" mt="1">
                      {channelFormErrors.chatId}
                    </Text>
                  )}
                </Box>
              </>
            )}

            {channelForm.type === "resend" && (
              <>
                <Box>
                  <Text as="label" size="2" mb="1" weight="medium">
                    {t("notifications.channels.apiKey")}
                  </Text>
                  <TextField.Input
                    type="password"
                    placeholder="re_123456789"
                    value={channelForm.config.apiKey}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        config: {
                          ...channelForm.config,
                          apiKey: e.target.value,
                        },
                      })
                    }
                  />
                  {channelFormErrors.apiKey && (
                    <Text size="1" color="red" mt="1">
                      {channelFormErrors.apiKey}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text as="label" size="2" mb="1" weight="medium">
                    {t("notifications.channels.from")}
                  </Text>
                  <TextField.Input
                    placeholder="您的名称 <no-reply@yourdomain.com>"
                    value={channelForm.config.from}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        config: {
                          ...channelForm.config,
                          from: e.target.value,
                        },
                      })
                    }
                  />
                  {channelFormErrors.from && (
                    <Text size="1" color="red" mt="1">
                      {channelFormErrors.from}
                    </Text>
                  )}
                  <Text size="1" color="gray" mt="1">
                    {t("notifications.channels.fromHint")}
                  </Text>
                </Box>

                <Box>
                  <Text as="label" size="2" mb="1" weight="medium">
                    {t("notifications.channels.to")}
                  </Text>
                  <TextField.Input
                    placeholder="user1@example.com, user2@example.com"
                    value={channelForm.config.to}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        config: {
                          ...channelForm.config,
                          to: e.target.value,
                        },
                      })
                    }
                  />
                  {channelFormErrors.to && (
                    <Text size="1" color="red" mt="1">
                      {channelFormErrors.to}
                    </Text>
                  )}
                </Box>
              </>
            )}

            {(channelForm.type === "feishu" ||
              channelForm.type === "wecom") && (
              <Box>
                <Text as="label" size="2" mb="1" weight="medium">
                  {t("notifications.channels.webhookUrl")}
                </Text>
                <TextField.Input
                  placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                  value={channelForm.config.webhookUrl}
                  onChange={(e) =>
                    setChannelForm({
                      ...channelForm,
                      config: {
                        ...channelForm.config,
                        webhookUrl: e.target.value,
                      },
                    })
                  }
                />
                {channelFormErrors.webhookUrl && (
                  <Text size="1" color="red" mt="1">
                    {channelFormErrors.webhookUrl}
                  </Text>
                )}
              </Box>
            )}
          </Flex>

          <Flex gap="3" mt="6" justify="end">
            <DialogClose>{t("common.cancel")}</DialogClose>
            <Button
              className="ml-auto"
              variant="secondary"
              onClick={handleSaveChannel}
              disabled={saving}
            >
              {saving ? t("common.savingChanges") : t("common.save")}
            </Button>
          </Flex>
        </DialogContent>
      </Dialog>
    );
  };

  // 渲染删除确认对话框
  const renderDeleteDialog = () => {
    return (
      <Dialog
        open={isDeleteChannelOpen}
        onOpenChange={(open) => {
          if (!open) setIsDeleteChannelOpen(false);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {t("notifications.channels.deleteConfirmTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("notifications.channels.deleteConfirmMessage")}
          </DialogDescription>

          <Flex gap="3" mt="6" justify="end">
            <DialogClose>{t("common.cancel")}</DialogClose>
            <Button
              color="red"
              onClick={handleConfirmDeleteChannel}
              disabled={saving}
            >
              {saving ? t("common.deleting") : t("common.delete")}
            </Button>
          </Flex>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Box>
      <Container>
        <Box mb="2">
          <Flex className="flex justify-between items-center detail-header">
            <Flex align="center" gap="2">
              <BellIcon width="20" height="20" />
              <Heading size="5" weight="medium">
                {t("notifications.title")}
              </Heading>
            </Flex>
            <Button
              className="ml-auto"
              variant="secondary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t("common.savingChanges") : t("common.save")}
            </Button>
          </Flex>
          <Text color="gray" size="2">
            {t("notifications.description")}
          </Text>
        </Box>
        
        {loading ? (
          <Text>{t("common.loading")}...</Text>
        ) : (
          <Card className="mb-4">
            <Tabs defaultValue="global">
              <TabsList className="overflow-auto">
                <TabsTrigger value="global">
                  {t("notifications.tabs.global")}
                </TabsTrigger>
                <TabsTrigger value="channels">
                  {t("notifications.tabs.channels")}
                </TabsTrigger>
                <TabsTrigger value="templates">
                  {t("notifications.tabs.templates")}
                </TabsTrigger>
                <TabsTrigger value="specificMonitors">
                  {t("notifications.tabs.specificMonitors")}
                </TabsTrigger>
                <TabsTrigger value="specificAgents">
                  {t("notifications.tabs.specificAgents")}
                </TabsTrigger>
              </TabsList>
              <Box pt="2" px="2">
                <TabsContent value="global">
                  {renderGlobalSettingsTab()}
                </TabsContent>

                <TabsContent value="channels">
                  {renderChannelsTab()}
                </TabsContent>

                <TabsContent value="templates">
                  {renderTemplatesTab()}
                </TabsContent>

                <TabsContent value="specificMonitors">
                  {renderSpecificMonitorsTab()}
                </TabsContent>

                <TabsContent value="specificAgents">
                  {renderSpecificAgentsTab()}
                </TabsContent>
              </Box>
            </Tabs>
          </Card>
        )}
      </Container>

      {/* 渠道管理对话框 */}
      {renderChannelDialog()}
      {renderDeleteDialog()}
    </Box>
  );
};

export default NotificationsConfig;

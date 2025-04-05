import { useState, useEffect, useRef } from 'react';
import { Box, Flex, Heading, Text, Card, Button, TextField, TextArea, Tabs, Separator, Container, Theme } from '@radix-ui/themes';
import { EyeOpenIcon, CopyIcon, CheckIcon } from '@radix-ui/react-icons';
import * as Toast from '@radix-ui/react-toast';
import { getAllMonitors, Monitor } from '../../api/monitors';
import { getAllAgents, Agent } from '../../api/agents';
import { 
  getStatusPageConfig, 
  saveStatusPageConfig, 
  StatusPageConfig as StatusConfig,
  StatusPageConfigResponse
} from '../../api/status';
import '../../styles/components.css';
import { useTranslation } from 'react-i18next';

// 监控项带选择状态
interface MonitorWithSelection extends Monitor {
  selected: boolean;
}

// 客户端带选择状态
interface AgentWithSelection extends Agent {
  selected: boolean;
}

// 状态页配置带详细信息
interface StatusConfigWithDetails {
  title: string;
  description: string;
  logoUrl: string;
  customCss: string;
  publicUrl: string;
  monitors: MonitorWithSelection[];
  agents: AgentWithSelection[];
}

const StatusPageConfig = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const hasInitializedRef = useRef(false);
  const { t } = useTranslation();
  
  // 初始化配置对象
  const [config, setConfig] = useState<StatusConfigWithDetails>({
    title: t('statusPage.title'),
    description: t('statusPage.allOperational'),
    logoUrl: '',
    customCss: '',
    publicUrl: window.location.origin + '/status',
    monitors: [],
    agents: []
  });

  // 从API获取数据
  useEffect(() => {
    // 使用 ref 防止重复请求
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    setLoading(true);
    
    const fetchData = async () => {
      try {
        // 获取状态页配置
        console.log(t('statusPageConfig.fetchingConfig'));
        const configResponse = await getStatusPageConfig();
        console.log('==== 状态页配置API响应 ====', JSON.stringify(configResponse, null, 2));
        
        let configData: StatusPageConfigResponse | null = null;
        
        // 判断响应是否包含所需数据
        if (configResponse) {
          if (configResponse.success === false) {
            console.log(t('common.error.fetch'), configResponse.message);
          } else if (configResponse.config) {
            // 从config属性获取配置
            configData = configResponse.config;
            console.log(t('statusPageConfig.configFromProperty'), JSON.stringify(configData, null, 2));
          } else {
            // 直接使用API响应作为配置数据 (可能是后端直接返回了配置对象)
            try {
              // 尝试将响应作为配置数据直接使用
              if ('monitors' in configResponse && Array.isArray(configResponse.monitors)) {
                console.log(t('statusPageConfig.tryingDirectResponse'));
                configData = configResponse as unknown as StatusPageConfigResponse;
              }
            } catch (err) {
              console.error(t('statusPageConfig.parseError'), err);
            }
          }
          
          // 输出配置信息
          if (configData && configData.monitors && Array.isArray(configData.monitors)) {
            console.log(t('statusPageConfig.receivedConfig'), JSON.stringify(configData, null, 2));
            console.log(t('statusPageConfig.monitorListType'), Array.isArray(configData.monitors) ? 'Array' : typeof configData.monitors);
            console.log(t('statusPageConfig.monitorCount'), configData.monitors.length);
            configData.monitors.forEach(monitor => {
              console.log(`${t('statusPageConfig.configMonitor')}: id=${monitor.id}, name=${monitor.name}, selected=${monitor.selected}`);
            });
          } else {
            console.log(t('statusPageConfig.noValidConfig'));
          }
        } else {
          console.log(t('statusPageConfig.invalidResponse'));
        }

        // 获取监控数据
        console.log(t('statusPageConfig.fetchingMonitors'));
        const monitorsResponse = await getAllMonitors();
        console.log(t('statusPageConfig.monitorsResponse'), JSON.stringify(monitorsResponse, null, 2));
        
        if (monitorsResponse.success && monitorsResponse.monitors) {
          const monitorsWithSelection = monitorsResponse.monitors.map(monitor => {
            // 在配置中查找对应ID的监控项
            let isSelected = false;
            
            if (configData && configData.monitors && Array.isArray(configData.monitors)) {
              // 查找配置中的对应监控项
              const configMonitor = configData.monitors.find(m => m.id === monitor.id);
              if (configMonitor) {
                console.log(`${t('statusPageConfig.foundMonitor')}: ${monitor.name}(${monitor.id}), ${t('statusPageConfig.originalStatus')}:`, configMonitor.selected);
                // 确保严格布尔值比较
                isSelected = configMonitor.selected === true;
                console.log(`${t('statusPageConfig.processedStatus')}: ${isSelected}`);
              } else {
                console.log(`${t('statusPageConfig.notFoundMonitor')}: ${monitor.name}(${monitor.id})`);
              }
            }
            
            console.log(`${t('statusPageConfig.finalMonitorResult')}: ${monitor.name}(${monitor.id}) - ${t('statusPageConfig.selectedStatus')}: ${isSelected}`);
            
            return {
              ...monitor,
              selected: isSelected
            };
          });
          
          console.log(t('statusPageConfig.processedMonitorList'), monitorsWithSelection.map(m => ({
            id: m.id,
            name: m.name,
            selected: m.selected
          })));
          
          // 获取客户端数据
          console.log(t('statusPageConfig.fetchingAgents'));
          const agentsResponse = await getAllAgents();
          if (agentsResponse.success && agentsResponse.agents) {
            const agentsWithSelection = agentsResponse.agents.map((agent: Agent) => {
              // 在配置中查找对应ID的客户端
              let isSelected = false;
              
              if (configData && configData.agents && Array.isArray(configData.agents)) {
                // 查找配置中的对应客户端
                const configAgent = configData.agents.find(a => a.id === agent.id);
                if (configAgent) {
                  console.log(`${t('statusPageConfig.foundAgent')}: ${agent.name}(${agent.id}), ${t('statusPageConfig.originalStatus')}:`, configAgent.selected);
                  // 确保严格布尔值比较
                  isSelected = configAgent.selected === true;
                  console.log(`${t('statusPageConfig.processedStatus')}: ${isSelected}`);
                } else {
                  console.log(`${t('statusPageConfig.notFoundAgent')}: ${agent.name}(${agent.id})`);
                }
              }
              
              console.log(`${t('statusPageConfig.finalAgentResult')}: ${agent.name}(${agent.id}) - ${t('statusPageConfig.selectedStatus')}: ${isSelected}`);
              
              return {
                ...agent,
                selected: isSelected
              };
            });
            
            console.log(t('statusPageConfig.processedAgentList'), agentsWithSelection.map((a: AgentWithSelection) => ({
              id: a.id,
              name: a.name,
              selected: a.selected
            })));
            
            setConfig(prev => ({
              ...prev,
              title: configData?.title || t('statusPage.title'),
              description: configData?.description || t('statusPage.allOperational'),
              logoUrl: configData?.logoUrl || '',
              customCss: configData?.customCss || '',
              monitors: monitorsWithSelection,
              agents: agentsWithSelection
            }));
          }
        } else {
          console.error(t('statusPageConfig.fetchMonitorsError'));
          setError(t('statusPageConfig.fetchMonitorsError'));
        }
      } catch (error) {
        console.error(t('statusPageConfig.fetchDataError'), error);
        setError(t('statusPageConfig.fetchDataError'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [t]);

  useEffect(() => {
    if (!loading && config.monitors.length > 0) {
      console.log('=====================');
      console.log(t('statusPageConfig.configLoaded'));
      config.monitors.forEach(monitor => {
        console.log(`- ${monitor.name}(ID: ${monitor.id}): ${monitor.selected ? t('common.yes') : t('common.no')}`);
      });
      console.log('=====================');
    }
  }, [loading, config.monitors, t]);

  // 处理表单字段变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理监控选择变化
  const handleMonitorChange = (id: number, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      monitors: prev.monitors.map(monitor => 
        monitor.id === id ? { ...monitor, selected: checked } : monitor
      )
    }));
  };

  // 处理客户端监控选择变化
  const handleAgentChange = (id: number, checked: boolean) => {
    // 确保id是有效的数字
    if (isNaN(id) || id <= 0) {
      console.error(t('statusPageConfig.invalidAgentId'), id);
      return;
    }
    
    setConfig(prev => ({
      ...prev,
      agents: prev.agents.map(agent => 
        agent.id === id ? { ...agent, selected: checked } : agent
      )
    }));
  };

  // 复制公共URL
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(config.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 保存配置
  const handleSave = async () => {
    setSaving(true);
    try {
      // 构建要保存的配置对象
      const configToSave: StatusConfig = {
        title: config.title,
        description: config.description,
        logoUrl: config.logoUrl,
        customCss: config.customCss,
        monitors: config.monitors.filter(m => m.selected).map(m => m.id),
        agents: config.agents.filter(a => a.selected).map(a => a.id)
      };
      
      // 调试日志
      console.log(t('statusPageConfig.savingConfig'), configToSave);
      console.log(t('statusPageConfig.selectedMonitors'), config.monitors.filter(m => m.selected));
      console.log(t('statusPageConfig.selectedMonitorIds'), configToSave.monitors);
      
      // 调用API保存配置
      console.log(t('statusPageConfig.callingSaveApi'));
      const response = await saveStatusPageConfig(configToSave);
      console.log(t('statusPageConfig.saveApiResponse'), response);
      
      if (response.success) {
        setToastMessage(t('statusPageConfig.configSaved'));
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        setToastMessage(response.message || t('statusPageConfig.saveError'));
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
      }
    } catch (err) {
      console.error(t('statusPageConfig.saveError'), err);
      setToastMessage(t('statusPageConfig.saveError'));
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // 预览状态页
  const handlePreview = () => {
    // 在新标签页中打开状态页
    window.open('/status', '_blank');
  };

  // 错误显示
  if (error) {
    return (
      <Box>
        <div className="page-container detail-page">
          <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
            <Text size="3" style={{ color: 'var(--red-9)' }}>{error}</Text>
            <Button variant="ghost" size="2" className="nav-button config-button" onClick={() => window.location.reload()} ml="2">
              {t('common.retry')}
            </Button>
          </Flex>
        </div>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box>
        <div className="page-container detail-page">
          <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
            <Text size="3">{t('common.loading')}</Text>
          </Flex>
        </div>
      </Box>
    );
  }

  return (
    <Box>
      <Theme appearance="light" accentColor="blue">
        <Container>
          <div className="page-container detail-page">
            {/* 美化顶部导航栏 */}
            <Box mb="5">
              <Flex justify="between" align="center" className="detail-header" py="3">
                <Flex align="center" gap="2">
                  <Heading size="5" weight="medium">{t('statusPageConfig.title')}</Heading>
                </Flex>
                <Flex gap="3" align="center">
                  <Button variant="ghost" size="2" className="nav-button config-button" onClick={handlePreview}>
                    <EyeOpenIcon width="16" height="16" />
                    <Text size="2">{t('statusPageConfig.preview')}</Text>
                  </Button>
                  <Button variant="soft" size="2" className="nav-button config-button" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <span style={{ width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" fill="currentColor">
                              <animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite" />
                            </path>
                          </svg>
                        </span>
                        <Text size="2">{t('common.savingChanges')}</Text>
                      </>
                    ) : (
                      <>
                        <CheckIcon width="16" height="16" />
                        <Text size="2">{t('statusPageConfig.save')}</Text>
                      </>
                    )}
                  </Button>
                </Flex>
              </Flex>
              <Separator size="4" mb="4" color="gray" />
            </Box>

            <div className="detail-content">
              <Card size="2">
                <Tabs.Root defaultValue="general" className="config-tabs">
                  <Tabs.List className="config-tabs-list">
                    <Tabs.Trigger value="general" className="tab-trigger">{t('statusPageConfig.general')}</Tabs.Trigger>
                    <Tabs.Trigger value="services" className="tab-trigger">{t('statusPageConfig.services')}</Tabs.Trigger>
                    <Tabs.Trigger value="agents" className="tab-trigger">{t('statusPageConfig.agents')}</Tabs.Trigger>
                  </Tabs.List>

                  <Box pt="5" px="2" className="tab-content-container">
                    <Tabs.Content value="general" className="tab-content">
                      <Flex direction="column" gap="5">
                        <Box>
                          <Text as="label" size="2" weight="medium" style={{ marginBottom: '6px', display: 'block' }}>
                            {t('statusPageConfig.pageTitle')}
                          </Text>
                          <TextField.Input
                            name="title"
                            value={config.title}
                            onChange={handleChange}
                            placeholder={t('statusPageConfig.pageTitlePlaceholder')}
                            size="3"
                          />
                        </Box>

                        <Box>
                          <Text as="label" size="2" weight="medium" style={{ marginBottom: '6px', display: 'block' }}>
                            {t('statusPageConfig.pageDescription')}
                          </Text>
                          <TextArea
                            name="description"
                            value={config.description}
                            onChange={handleChange}
                            placeholder={t('statusPageConfig.pageDescriptionPlaceholder')}
                            style={{ minHeight: '80px' }}
                            size="3"
                          />
                        </Box>

                        <Box>
                          <Text as="label" size="2" weight="medium" style={{ marginBottom: '6px', display: 'block' }}>
                            {t('statusPageConfig.publicUrl')}
                          </Text>
                          <Flex gap="2">
                            <Box style={{ flex: 1, position: 'relative' }}>
                              <TextField.Input
                                value={config.publicUrl}
                                readOnly
                                style={{ 
                                  width: '100%', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  paddingRight: '16px'
                                }}
                                size="3"
                              />
                            </Box>
                            <Button variant="ghost" size="2" className="nav-button copy-button" onClick={handleCopyUrl}>
                              {copied ? (
                                <>
                                  <CheckIcon width="16" height="16" />
                                  <Text size="2">{t('common.copied')}</Text>
                                </>
                              ) : (
                                <>
                                  <CopyIcon width="16" height="16" />
                                  <Text size="2">{t('common.copy')}</Text>
                                </>
                              )}
                            </Button>
                          </Flex>
                          <Text size="1" color="gray" style={{ marginTop: '6px', display: 'block', lineHeight: '1.5' }}>
                            {t('statusPageConfig.publicUrlHelp')}
                          </Text>
                        </Box>

                        <Box style={{ background: 'var(--gray-2)', padding: '12px 14px', borderRadius: '8px', marginTop: '4px' }}>
                          <Text as="div" size="2" color="gray" style={{ lineHeight: '1.5' }}>
                            {t('statusPageConfig.selectionNote')}
                          </Text>
                        </Box>
                      </Flex>
                    </Tabs.Content>

                    <Tabs.Content value="services" className="tab-content">
                      <Flex direction="column" gap="5">
                        <Text size="2" color="gray" mb="3">{t('statusPageConfig.selectServicesPrompt')}</Text>
                        
                        {config.monitors.length === 0 ? (
                          <Text color="gray">{t('monitors.noMonitors')}</Text>
                        ) : (
                          <Box>
                            {config.monitors.map(monitor => {
                              console.log(`【${t('statusPageConfig.serviceRendering')}】${monitor.name}(${monitor.id}), ${t('statusPageConfig.selectedStatus')}: ${monitor.selected}`);
                              return (
                                <Flex key={monitor.id} align="center" justify="between" className="service-item">
                                  <Text size="3">{monitor.name}</Text>
                                  <div className="custom-checkbox">
                                    <input 
                                      type="checkbox"
                                      id={`monitor-${monitor.id}`}
                                      checked={monitor.selected}
                                      onChange={(e) => {
                                        console.log(`${t('statusPageConfig.monitorStatusChange')}: ${monitor.name}(${monitor.id}), ${t('statusPageConfig.from')} ${monitor.selected} ${t('statusPageConfig.to')} ${e.target.checked}`);
                                        handleMonitorChange(monitor.id, e.target.checked);
                                      }}
                                    />
                                    <label htmlFor={`monitor-${monitor.id}`} className={monitor.selected ? 'checked' : ''}></label>
                                  </div>
                                </Flex>
                              );
                            })}
                          </Box>
                        )}
                      </Flex>
                    </Tabs.Content>
                    
                    <Tabs.Content value="agents" className="tab-content">
                      <Flex direction="column" gap="5">
                        <Text size="2" color="gray" mb="3">{t('statusPageConfig.selectAgentsPrompt')}</Text>
                        
                        {config.agents.length === 0 ? (
                          <Text color="gray">{t('agents.noAgents')}</Text>
                        ) : (
                          <Box>
                            {config.agents.map(agent => {
                              console.log(`【${t('statusPageConfig.agentRendering')}】${agent.name}(${agent.id}), ${t('statusPageConfig.selectedStatus')}: ${agent.selected}`);
                              return (
                                <Flex key={agent.id} align="center" justify="between" className="service-item">
                                  <Text size="3">{agent.name}</Text>
                                  <div className="custom-checkbox">
                                    <input 
                                      type="checkbox"
                                      id={`agent-${agent.id}`}
                                      checked={agent.selected}
                                      onChange={(e) => {
                                        console.log(`${t('statusPageConfig.agentStatusChange')}: ${agent.name}(${agent.id}), ${t('statusPageConfig.from')} ${agent.selected} ${t('statusPageConfig.to')} ${e.target.checked}`);
                                        handleAgentChange(agent.id, e.target.checked);
                                      }}
                                    />
                                    <label htmlFor={`agent-${agent.id}`} className={agent.selected ? 'checked' : ''}></label>
                                  </div>
                                </Flex>
                              );
                            })}
                          </Box>
                        )}
                      </Flex>
                    </Tabs.Content>
                  </Box>
                </Tabs.Root>
              </Card>
            </div>
          </div>

          {/* Toast 提示 */}
          <Toast.Provider swipeDirection="right">
            <Toast.Viewport className="ToastViewport" />
            
            {showSuccessToast && (
              <Toast.Root className="ToastRoot" duration={3000} style={{ backgroundColor: 'var(--green-9)', borderRadius: '8px' }}>
                <div className="ToastContent">
                  <div className="ToastIcon" style={{ backgroundColor: 'var(--green-10)', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon color="white" width="18" height="18" />
                  </div>
                  <div className="ToastText">
                    <div className="ToastTitle" style={{ fontSize: '15px', fontWeight: '600' }}>{t('common.success')}</div>
                    <div className="ToastDescription" style={{ fontSize: '13px', opacity: '0.9' }}>{toastMessage}</div>
                  </div>
                  <Toast.Close className="ToastClose" style={{ opacity: '0.8', backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }} aria-label={t('common.close')}>
                    ×
                  </Toast.Close>
                </div>
              </Toast.Root>
            )}

            {showErrorToast && (
              <Toast.Root className="ToastRoot" duration={3000} style={{ backgroundColor: 'var(--red-9)', borderRadius: '8px' }}>
                <div className="ToastContent">
                  <div className="ToastIcon" style={{ backgroundColor: 'var(--red-10)', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.5 0.875C3.83475 0.875 0.875 3.83475 0.875 7.5C0.875 11.1652 3.83475 14.125 7.5 14.125C11.1652 14.125 14.125 11.1652 14.125 7.5C14.125 3.83475 11.1652 0.875 7.5 0.875ZM7.5 8.5C6.94772 8.5 6.5 8.05228 6.5 7.5C6.5 6.94772 6.94772 6.5 7.5 6.5C8.05228 6.5 8.5 6.94772 8.5 7.5C8.5 8.05228 8.05228 8.5 7.5 8.5ZM6.75 4.25L7 6.25H8L8.25 4.25H6.75Z" fill="white" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ToastText">
                    <div className="ToastTitle" style={{ fontSize: '15px', fontWeight: '600' }}>{t('common.error')}</div>
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
    </Box>
  );
};

export default StatusPageConfig; 
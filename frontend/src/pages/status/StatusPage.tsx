import { useState, useEffect } from "react";
import { Box, Flex, Heading, Text, Grid, Theme } from "@radix-ui/themes";
import { getStatusPageData } from "../../api/status";
import AgentCard from "../../components/AgentCard";
import MonitorCard from "../../components/MonitorCard";
import AgentStatusBar from "../../components/AgentStatusBar";
import { useTranslation } from "react-i18next";
import {
  Agent,
  MonitorWithDailyStatsAndStatusHistory,
  MetricHistory,
  AgentWithLatestMetrics,
} from "../../types";
import { getLatestAgentMetrics, getAgentMetrics } from "../../api/agents";

const StatusPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<{
    monitors: MonitorWithDailyStatsAndStatusHistory[];
    agents: AgentWithLatestMetrics[];
  }>({
    monitors: [],
    agents: [],
  });
  const [loading, setLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>(t("statusPage.title"));
  const [pageDescription, setPageDescription] = useState<string>(
    t("statusPage.allOperational")
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] =
    useState<AgentWithLatestMetrics | null>(null);
  const [selectedAgentMetrics, setSelectedAgentMetrics] = useState<
    MetricHistory[] | null
  >(null);
  const [cardLoading, setCardLoading] = useState(false);

  // 从API获取数据
  useEffect(() => {
    fetchData();
    // 设置定时刷新，每3分钟更新数据
    const intervalId = setInterval(() => {
      fetchData();
    }, 180000);
    return () => clearInterval(intervalId);
  }, []);

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    const response = await getStatusPageData();
    if (response) {
      setPageTitle(response.title || t("statusPage.title"));
      setPageDescription(
        response.description || t("statusPage.allOperational")
      );
      // 只保留 AgentWithLatestMetrics 需要的字段，且 metrics 字段为 MetricHistory | undefined
      let agentsWithLatestMetrics: AgentWithLatestMetrics[] = (
        response.agents || []
      ).map((a: Agent) => {
        const { metrics, ...rest } = a;
        return { ...rest };
      });
      // 只请求最新指标
      await Promise.all(
        agentsWithLatestMetrics.map(async (agent) => {
          const metricsRes = await getLatestAgentMetrics(agent.id);
          // 确保我们只取数组中的第一条记录（最新的）
          const latestMetric = Array.isArray(metricsRes.agent)
            ? metricsRes.agent[0]
            : metricsRes.agent;
          agent.metrics = latestMetric;
        })
      );
      setData({
        monitors: response.monitors || [],
        agents: agentsWithLatestMetrics,
      });
    } else {
      setError(t("statusPage.fetchError"));
    }
    setLoading(false);
  };

  // 点击 agent 卡片时，获取完整指标
  const handleAgentClick = async (agent: AgentWithLatestMetrics) => {
    // 如果点击的是当前展开的 agent，则收起
    if (selectedAgent?.id === agent.id) {
      setSelectedAgent(null);
      setSelectedAgentMetrics(null);
      return;
    }

    setSelectedAgent(agent);
    setCardLoading(true);
    setSelectedAgentMetrics(null);
    const metricsRes = await getAgentMetrics(agent.id);
    setSelectedAgentMetrics(metricsRes.success ? metricsRes.agent || [] : []);
    setCardLoading(false);
  };

  // 错误显示
  if (error) {
    return (
      <Theme appearance="light">
        <Box>
          <div className="page-container">
            <Flex justify="center" align="center">
              <Text size="3">{error}</Text>
            </Flex>
          </div>
        </Box>
      </Theme>
    );
  }

  if (loading) {
    return (
      <Theme appearance="light">
        <Box>
          <div className="page-container">
            <Flex justify="center" align="center">
              <Text size="3">{t("common.loading")}</Text>
            </Flex>
          </div>
        </Box>
      </Theme>
    );
  }

  return (
    <Theme appearance="light">
      <Box>
        <div className="page-container sm:px-6 lg:px-[8%] px-4">
          {/* 状态页标题区域 */}
          <Flex
            direction="column"
            align="center"
            justify="center"
            py="9"
            gap="5"
          >
            <Heading size="9" align="center">
              {pageTitle}
            </Heading>
            <Text 
              size="5" 
              align="center" 
              className="whitespace-pre-wrap"
            >
              {pageDescription}
            </Text>
          </Flex>

          {/* 客户端监控状态 */}
          {data.agents.length > 0 && (
            <Box py="6">
              <Heading size="5" mb="4">
                {t("statusPage.agentStatus")}
              </Heading>
              <div className="grid grid-cols-1 gap-4">
                {data.agents.map((agent) => (
                  <div key={agent.id}>
                    <div
                      className="cursor-pointer transition hover:scale-[1.01]"
                      onClick={() => handleAgentClick(agent)}
                    >
                      <AgentStatusBar
                        latestMetric={agent.metrics}
                        agent={agent as any}
                      />
                    </div>
                    {/* 展开的详情区域 */}
                    {selectedAgent?.id === agent.id && (
                      <div className="mt-4">
                        {cardLoading ? (
                          <div className="flex items-center justify-center h-40">
                            <span className="text-lg text-gray-500">
                              {t("common.loading")}
                            </span>
                          </div>
                        ) : (
                          <AgentCard
                            agent={{
                              ...selectedAgent,
                              metrics: selectedAgentMetrics || [],
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Box>
          )}

          {/* API服务状态 */}
          {data.monitors.length > 0 && (
            <Box py="6">
              <Heading size="5" mb="4">
                {t("statusPage.apiServices")}
              </Heading>
              <Grid columns={{ initial: "1" }} gap="4">
                {data.monitors.map((monitor) => (
                  <MonitorCard monitor={monitor} key={monitor.id} />
                ))}
              </Grid>
            </Box>
          )}
        </div>
      </Box>
    </Theme>
  );
};

export default StatusPage;

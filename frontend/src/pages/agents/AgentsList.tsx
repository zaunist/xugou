import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  IconButton,
  Grid,
  Container,
} from "@radix-ui/themes";
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Badge,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";

import {
  PlusIcon,
  Pencil1Icon,
  InfoCircledIcon,
  ReloadIcon,
  LayoutIcon,
  ViewGridIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  getAllAgents,
  deleteAgent,
  getLatestAgentMetrics,
} from "../../api/agents";
import AgentStatusBar from "../../components/AgentStatusBar";
import { useTranslation } from "react-i18next";
import { AgentWithLatestMetrics } from "../../types";

// 定义客户端状态颜色映射
const statusColors: Record<string, "red" | "green" | "yellow" | "gray"> = {
  active: "green",
  inactive: "red",
  connecting: "yellow",
  unknown: "gray",
};

const AgentsList = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentWithLatestMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("card"); // 默认使用卡片视图
  const { t } = useTranslation();

  useEffect(() => {
    fetchAgents();
    // 设置定时器，每分钟刷新一次数据
    const intervalId = setInterval(() => {
      console.log("AgentsList: 自动刷新数据...");
      fetchAgents();
    }, 60000); // 60000ms = 1分钟

    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, [t]);

  // 获取客户端数据
  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    // 获取所有客户端
    const response = await getAllAgents();

    if (response.agents) {
      // 合并指标数据到客户端数据
      const agentsWithMetrics = await Promise.all(
        response.agents.map(async (agent) => {
          // 获取指定客户端的指标数据
          const metricsResponse = await getLatestAgentMetrics(agent.id);
          if (!metricsResponse.success) {
            console.error("获取指标数据失败:", metricsResponse.message);
            return { ...agent, metrics: undefined } as AgentWithLatestMetrics;
          }
          // 确保我们只取数组中的第一条记录（最新的）
          const latestMetric = Array.isArray(metricsResponse.agent)
            ? metricsResponse.agent[0]
            : metricsResponse.agent;

          return {
            ...agent,
            metrics: latestMetric,
          } as AgentWithLatestMetrics;
        })
      );
      console.log("获取到的 agentsWithMetrics 数据: ", agentsWithMetrics);
      setAgents(agentsWithMetrics as AgentWithLatestMetrics[]);
    }

    setLoading(false);
  };

  // 刷新客户端列表
  const handleRefresh = () => {
    fetchAgents();
  };

  // 打开删除确认对话框
  const handleDeleteClick = (agentId: number) => {
    setSelectedAgentId(agentId);
    setDeleteDialogOpen(true);
  };

  // 确认删除客户端
  const handleDeleteConfirm = async () => {
    if (selectedAgentId) {
      setLoading(true);
      try {
        const response = await deleteAgent(selectedAgentId);

        if (response.success) {
          // 删除成功，刷新客户端列表
          fetchAgents();
        } else {
          setError(response.message || t("common.error.delete"));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("common.error.delete"));
        console.error("删除客户端错误:", err);
      } finally {
        setDeleteDialogOpen(false);
        setSelectedAgentId(null);
        setLoading(false);
      }
    }
  };

  // 展示卡片视图
  const renderCardView = () => {
    return (
      <Grid columns={{ initial: "1" }} gap="4">
        {agents.map((agent) => (
          <Box key={agent.id} className="relative">
            <AgentStatusBar latestMetric={agent.metrics} agent={agent} />
            <Flex gap="2" className="absolute top-4 right-4">
              <IconButton
                variant="ghost"
                size="1"
                onClick={() => navigate(`/agents/${agent.id}`)}
                title={t("agent.details")}
              >
                <InfoCircledIcon />
              </IconButton>
              <IconButton
                variant="ghost"
                size="1"
                onClick={() => navigate(`/agents/edit/${agent.id}`)}
                title={t("agent.edit")}
              >
                <Pencil1Icon />
              </IconButton>
              <IconButton
                variant="ghost"
                size="1"
                color="red"
                onClick={() => handleDeleteClick(agent.id)}
                title={t("agent.delete")}
              >
                <TrashIcon />
              </IconButton>
            </Flex>
          </Box>
        ))}
      </Grid>
    );
  };

  // 展示表格视图
  const renderTableView = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>{t("agents.table.name")}</TableCell>
            <TableCell>{t("agents.table.host")}</TableCell>
            <TableCell>{t("agents.table.ip")}</TableCell>
            <TableCell>{t("agents.table.status")}</TableCell>
            <TableCell>{t("agents.table.os")}</TableCell>
            <TableCell>{t("agents.table.version")}</TableCell>
            <TableCell>{t("agents.table.actions")}</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell>
                <Text weight="medium">{agent.name}</Text>
              </TableCell>
              <TableCell>
                <Text>{agent.hostname || t("common.notFound")}</Text>
              </TableCell>
              <TableCell>
                <Text>
                  {agent.ip_addresses
                    ? (() => {
                        try {
                          const ipArray = JSON.parse(
                            String(agent.ip_addresses)
                          );
                          return Array.isArray(ipArray) && ipArray.length > 0
                            ? ipArray.join(", ")
                            : String(agent.ip_addresses);
                        } catch (e) {
                          return String(agent.ip_addresses);
                        }
                      })()
                    : t("common.notFound")}
                </Text>
              </TableCell>
              <TableCell>
                <Badge color={statusColors[agent.status || "unknown"]}>
                  {agent.status === "active"
                    ? t("agent.status.online")
                    : agent.status === "connecting"
                    ? t("agent.status.connecting")
                    : t("agent.status.offline")}
                </Badge>
              </TableCell>
              <TableCell>
                <Text>{agent.os || t("common.notFound")}</Text>
              </TableCell>
              <TableCell>
                <Text>{agent.version || t("common.notFound")}</Text>
              </TableCell>
              <TableCell>
                <Flex gap="2">
                  <IconButton
                    variant="soft"
                    onClick={() => navigate(`/agents/${agent.id}`)}
                  >
                    <InfoCircledIcon />
                  </IconButton>
                  <IconButton
                    variant="soft"
                    onClick={() => navigate(`/agents/edit/${agent.id}`)}
                  >
                    <Pencil1Icon />
                  </IconButton>
                  <IconButton
                    variant="soft"
                    color="red"
                    onClick={() => handleDeleteClick(agent.id)}
                  >
                    <TrashIcon />
                  </IconButton>
                </Flex>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // 加载中显示
  if (loading) {
    return (
      <Box>
        <Flex justify="center" align="center" p="4">
          <Text>{t("common.loading")}</Text>
        </Flex>
      </Box>
    );
  }

  // 错误显示
  if (error) {
    return (
      <Box className="page-container detail-page">
        <Card>
          <Flex>
            <Text>{error}</Text>
          </Flex>
        </Card>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          {t("common.retry")}
        </Button>
      </Box>
    );
  }

  return (
    <Container size="4">
      <Flex justify="between" align="start" direction={{ initial: "column", sm: "row" }}>
        <Heading size="6">{t("agents.pageTitle")}</Heading>
        <Flex className="mt-4 space-x-2">
          <Tabs defaultValue="card">
            <TabsList>
              <TabsTrigger
                value="card"
                onClick={() => setViewMode("card")}
                title={t("agents.cardView")}
              >
                <ViewGridIcon />
              </TabsTrigger>
              <TabsTrigger
                value="table"
                onClick={() => setViewMode("table")}
                title={t("agents.tableView")}
              >
                <LayoutIcon />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <ReloadIcon />
            {t("common.refresh")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              console.log(
                "点击添加客户端按钮(空列表)，准备导航到/agents/create"
              );
              try {
                navigate("/agents/create");
              } catch (err) {
                console.error("导航到添加客户端页面失败:", err);
              }
            }}
          >
            <PlusIcon />
            {t("agents.create")}
          </Button>
        </Flex>
      </Flex>

      <Box className="my-4 space-x-2">
        {agents.length === 0 ? (
          <Card>
            <Flex
              direction="column"
              align="center"
              justify="center"
              p="6"
              gap="3"
            >
              <Text>{t("agents.noAgents")}</Text>
              <Button onClick={() => navigate("/agents/create")}>
                <PlusIcon />
                {t("agents.create")}
              </Button>
            </Flex>
          </Card>
        ) : viewMode === "table" ? (
          // 表格视图
          renderTableView()
        ) : (
          // 卡片视图
          renderCardView()
        )}
      </Box>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogTitle>{t("common.deleteConfirmation")}</DialogTitle>
          <DialogDescription>
            {t("common.deleteConfirmMessage")}
          </DialogDescription>
          <Flex gap="3" mt="4" justify="end">
            <DialogClose asChild>
              <Button variant="secondary" color="gray">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button color="red" onClick={handleDeleteConfirm}>
              {t("common.delete")}
            </Button>
          </Flex>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default AgentsList;

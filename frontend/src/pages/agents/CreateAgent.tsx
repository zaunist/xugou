import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Heading, Text, Code } from "@radix-ui/themes";
import { Button, Card, Separator } from "@/components/ui";
import {
  ArrowLeftIcon,
  CopyIcon,
  CheckIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { generateToken } from "../../api/agents";
import { useTranslation } from "react-i18next";
import { ENV_API_BASE_URL } from "../../config";

const CreateAgent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  // 获取当前浏览器访问的地址作为服务端地址
  const serverUrl = ENV_API_BASE_URL;
  const { t } = useTranslation();

  // State for copy buttons
  const [serverUrlCopied, setServerUrlCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [installCommandCopied, setInstallCommandCopied] = useState(false);

  // 生成服务端验证的 token
  useEffect(() => {
    // 获取当前访问的URL

    const fetchToken = async () => {
      setLoading(true);
      try {
        const response = await generateToken();
        if (response.success && response.token) {
          setToken(response.token);
        } else {
          console.error("获取 token 失败:", response.message);
        }
      } catch (error) {
        console.error("获取 token 失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  // 复制Server URL
  const handleCopyServerUrl = () => {
    navigator.clipboard.writeText(serverUrl);
    setServerUrlCopied(true);
    setTimeout(() => setServerUrlCopied(false), 2000);
  };

  // 复制token
  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  // 生成并复制安装命令
  const installScriptUrl =
    "https://gh-proxy.com/github.com/zaunist/xugou/blob/main/install-agent.sh";
  const oneLinerInstallCommand = `curl -sSL ${installScriptUrl} | bash -s -- --server ${serverUrl} --token ${token} --interval 60`;

  const handleCopyInstallCommand = () => {
    navigator.clipboard.writeText(oneLinerInstallCommand);
    setInstallCommandCopied(true);
    setTimeout(() => setInstallCommandCopied(false), 2000);
  };

  return (
    <Box className="sm:px-6 lg:px-[8%]">
      <Flex justify="between" align="center">
        <Flex align="center" gap="2">
          <Button variant="secondary" onClick={() => navigate("/agents")}>
            <ArrowLeftIcon />
          </Button>
          <Heading size="6">{t("agent.form.title.create")}</Heading>
        </Flex>
      </Flex>
      <Card className="my-4 pr-4">
        <Flex direction="column" gap="2" className="ml-4">
          {/* 提示信息 */}
          <Box>
            <Flex gap="2">
              <InfoCircledIcon />
              <Text>{t("agent.add.note")}</Text>
            </Flex>
          </Box>

          {/* 服务端地址 */}
          <Box>
            <Text as="label" size="2" weight="bold">
              {t("agent.add.serverAddress")}
            </Text>
            <Flex gap="2" align="center">
              <Text className="token-display">{serverUrl}</Text>
              <Button variant="secondary" onClick={handleCopyServerUrl} className="ml-2">
                {serverUrlCopied ? <CheckIcon /> : <CopyIcon />}
                {serverUrlCopied ? t("common.copied") : t("common.copy")}
              </Button>
            </Flex>
            <Text size="1" color="gray">
              {t("agent.add.serverAddressHelp")}
            </Text>
          </Box>

          {/* 客户端Token */}
          <Box>
            <Text as="label" size="2" weight="bold">
              {t("agent.add.registrationToken")}
            </Text>
            {loading ? (
              <Text>{t("agent.add.generatingToken")}</Text>
            ) : (
              <>
                <Flex gap="2" align="center">
                  <Text className="token-display break-all">{token}</Text>
                  <Button variant="secondary" onClick={handleCopyToken}>
                    {tokenCopied ? <CheckIcon /> : <CopyIcon />}
                    {tokenCopied ? t("common.copied") : t("common.copy")}
                  </Button>
                </Flex>
                <Text size="1" color="gray">
                  {t("agent.add.tokenHelp")}
                </Text>
              </>
            )}
          </Box>

          <Separator />

          {/* 安装指南 */}
          <Box>
            <Flex align="baseline" gap="2" mb="3">
              <Heading size="4">{t("agent.add.installGuide")}</Heading>
              <Text size="2" color="gray">
                {t(
                  "agent.add.installCommandHelpText",
                  "使用以下命令自动下载并安装 Agent："
                )}
              </Text>
            </Flex>

            <Card>
              <Flex direction="column" gap="3" p="3">
                <Text as="div" size="2" weight="bold" mb="1">
                  {t(
                    "agent.add.oneLinerCommandTitle",
                    "一键安装命令 (Linux/macOS/Windows):"
                  )}
                </Text>
                <Code size="2">{oneLinerInstallCommand}</Code>
                <Button variant="secondary" onClick={handleCopyInstallCommand}>
                  {installCommandCopied ? <CheckIcon /> : <CopyIcon />}
                  {installCommandCopied ? t("common.copied") : t("common.copy")}
                </Button>
                <Text size="1" color="gray">
                  {t(
                    "agent.add.oneLinerCommandNote",
                    "注意: 此脚本在 Linux 上安装服务时需要 sudo 权限。Windows 用户请参考脚本内的提示手动下载。"
                  )}
                </Text>
              </Flex>
            </Card>
          </Box>

          {/* 返回按钮 */}
          <Flex justify="end" gap="3">
            <Button variant="secondary" onClick={() => navigate("/agents")}>
              {t("agent.add.returnToList")}
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
};

export default CreateAgent;

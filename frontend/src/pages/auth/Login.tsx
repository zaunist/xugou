import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Flex, Heading, Text } from "@radix-ui/themes";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "../../providers/AuthProvider";
import { useTranslation } from "react-i18next";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // 检查是否有来自注册页面的消息
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login({ username, password });
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || t("login.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Flex
        justify="center"
        align="center"
        style={{ minHeight: "calc(100vh - 130px)", padding: "2rem 0" }}
      >
        <Card style={{ width: "400px", padding: "2rem" }}>
          <Flex direction="column" gap="4">
            <Heading align="center" size="6">
              {t("login.title")}
            </Heading>

            {message && (
              <Text color="green" align="center">
                {message}
              </Text>
            )}

            {error && (
              <Text color="red" align="center">
                {error}
              </Text>
            )}

            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="3">
                <Input
                  placeholder={t("login.username")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="text-gray-900"
                />
                <Input
                  placeholder={t("login.password")}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-gray-900"
                />

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t("common.loading") : t("login.button")}
                </Button>
              </Flex>
            </form>
          </Flex>
        </Card>
      </Flex>
    </div>
  );
};

export default Login;

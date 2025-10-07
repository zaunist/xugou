import { useState, useEffect } from "react";
import { Table, Text, Flex, Heading, Box } from "@radix-ui/themes";
import {
  Button,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction,
} from "@/components/ui";
import { getAllUsers, deleteUser } from "../../api/users";
import { User } from "../../types";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllUsers();
      if (response.success && response.users) {
        setUsers(response.users);
      } else {
        setError(response.message || t("users.error.fetch"));
        toast.error(response.message || t("users.error.fetch"));
      }
    } catch (err: any) {
      const errorMessage = err.message || t("users.error.fetch");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 修复：直接将要删除的ID作为参数传入，避免状态更新延迟问题
  const handleDelete = async (id: number) => {
    try {
      const response = await deleteUser(id);
      if (response.success) {
        // 更新前端UI，直接移除被删除的用户
        setUsers(users.filter((user) => user.id !== id));
        toast.success(response.message || t("users.success.delete"));
      } else {
        setError(response.message || t("users.error.delete"));
        toast.error(response.message || t("users.error.delete"));
      }
    } catch (err: any) {
      const errorMessage = err.message || t("users.error.delete");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <Box className="sm:px-6 lg:px-[8%]">
      <Flex justify="between" align="center" mb="4">
        <Heading size="6">{t("users.title")}</Heading>
        <Button variant="secondary" onClick={() => navigate("/users/create")}>
          {t("users.create")}
        </Button>
      </Flex>

      {/* 错误信息现在通过 toast 显示，如果需要也可以保留这里的 Text 组件 */}
      {error && (
        <Text color="red" mb="4">
          {`错误: ${error}`}
        </Text>
      )}

      {loading ? (
        <Text>{t("common.loading")}</Text>
      ) : (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>
                {t("user.username")}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>{t("user.email")}</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>{t("user.role")}</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>
                {t("common.actions")}
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {users.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5}>
                  <Text align="center">{t("users.noUsers")}</Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>{user.id}</Table.Cell>
                  <Table.Cell>{user.username}</Table.Cell>
                  <Table.Cell>{user.email || "-"}</Table.Cell>
                  <Table.Cell>{user.role}</Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        {t("common.edit")}
                      </Button>
                      {user.role !== "admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="secondary">
                              {t("common.delete")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>
                              {t("common.deleteConfirmation")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("users.deleteConfirm", {
                                username: user.username,
                              })}
                            </AlertDialogDescription>
                            <Flex gap="3" mt="4" justify="end">
                              <AlertDialogCancel>
                                {t("common.cancel")}
                              </AlertDialogCancel>
                              {/* 修复：直接在 onClick 中调用 handleDelete 并传入 user.id */}
                              <AlertDialogAction
                                onClick={() => handleDelete(user.id)}
                              >
                                {t("common.delete")}
                              </AlertDialogAction>
                            </Flex>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  );
};

export default UsersList;
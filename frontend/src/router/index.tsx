import { createBrowserRouter, RouteObject, Outlet } from "react-router-dom";
import { lazy, Suspense, ReactNode } from "react";

// 布局
import Layout from "../components/Layout";
import UsersList from "../pages/users/UsersList";
import UserProfile from "../pages/users/UserProfile";

// 懒加载页面组件
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Home = lazy(() => import("../pages/Home"));
const NotFound = lazy(() => import("../pages/NotFound"));

// 代理页面组件
const AgentsList = lazy(() => import("../pages/agents/AgentsList"));
const AgentDetail = lazy(() => import("../pages/agents/AgentDetail"));
const CreateAgent = lazy(() => import("../pages/agents/CreateAgent"));
const EditAgent = lazy(() => import("../pages/agents/EditAgent"));

// 状态页面组件
const StatusPage = lazy(() => import("../pages/status/StatusPage"));
const StatusPageConfig = lazy(() => import("../pages/status/StatusPageConfig"));

// 监控页面组件
const MonitorsList = lazy(() => import("../pages/monitors/MonitorsList"));
const MonitorDetail = lazy(() => import("../pages/monitors/MonitorDetail"));
const CreateMonitor = lazy(() => import("../pages/monitors/CreateMonitor"));
const EditMonitor = lazy(() => import("../pages/monitors/EditMonitor"));

// 通知页面组件
const NotificationsConfig = lazy(
  () => import("../pages/notifications/NotificationsConfig")
);

// 认证页面组件
const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));

// 用于包装Layout并提供children
interface LayoutWrapperProps {
  children: ReactNode;
}
const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  // 检查当前路径是否为状态页面，如果是则不使用Layout包裹
  const isStatusPage = window.location.pathname === "/status";
  return isStatusPage ? <>{children}</> : <Layout>{children}</Layout>;
};

// 需要授权的路由
const protectedRoutes: RouteObject[] = [
  {
    path: "/dashboard",
    element: (
      <Suspense fallback={<div>加载中...</div>}>
        <Dashboard />
      </Suspense>
    ),
  },
  // 代理页面
  {
    path: "/agents",
    children: [
      {
        path: "",
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <AgentsList />
          </Suspense>
        ),
      },
      {
        path: ":id",
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <AgentDetail />
          </Suspense>
        ),
      },
      {
        path: "create",
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <CreateAgent />
          </Suspense>
        ),
      },
      {
        path: "edit/:id",
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <EditAgent />
          </Suspense>
        ),
      },
    ],
  },
  // 状态页面
  {
    path: "/status",
    children: [
      {
        path: "",
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <StatusPage />
          </Suspense>
        ),
      },
      {
        path: "config",
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <StatusPageConfig />
          </Suspense>
        ),
      },
    ],
  },
  // 监控页面
  {
    path: "/monitors",
    children: [
      {
        path: "",
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <MonitorsList />
          </Suspense>
        ),
      },
      {
        path: ":id",
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <MonitorDetail />
          </Suspense>
        ),
      },
      {
        path: "create",
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <CreateMonitor />
          </Suspense>
        ),
      },
      {
        path: "edit/:id",
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <EditMonitor />
          </Suspense>
        ),
      },
    ],
  },
  // 通知页面
  {
    path: "/notifications",
    element: (
      <Suspense fallback={<div>加载中...</div>}>
        <NotificationsConfig />
      </Suspense>
    ),
  },
  // 用户管理
  {
    path: "/users",
    element: (
      <Suspense fallback={<div>加载中...</div>}>
        <UsersList />
      </Suspense>
    ),
  },

  // 个人资料
  {
    path: "/profile",
    element: (
      <Suspense fallback={<div>加载中...</div>}>
        <UserProfile />
      </Suspense>
    ),
  },
];

// 公共路由
const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: (
      <Suspense fallback={<div>加载中...</div>}>
        <Home />
      </Suspense>
    ),
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<div>加载中...</div>}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={<div>加载中...</div>}>
        <Register />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<div>加载中...</div>}>
        <NotFound />
      </Suspense>
    ),
  },
];

// 创建路由
const router = createBrowserRouter(
  [
    {
      element: (
        <LayoutWrapper>
          <Outlet />
        </LayoutWrapper>
      ),
      children: [...protectedRoutes, ...publicRoutes],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);

export default router;

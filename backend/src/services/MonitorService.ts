import * as models from "../models";
import * as repositories from "../repositories";
import * as NotificationService from "./NotificationService";

export async function getMonitorsToCheck() {
  return await repositories.getMonitorsToCheck();
}

export async function checkMonitor(monitor: models.Monitor) {
  try {
    console.log(`开始检查监控项: ${monitor.name} (${monitor.url})`);

    // 记录监控之前的状态
    const previousStatus = monitor.status;

    const startTime = Date.now();
    let response;
    let headers: Headers = new Headers();
    let error = null;

    try {
      // 设置超时
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        (monitor.timeout || 30) * 1000
      );

      // 如果headers是字符串，则转换为对象
      if (typeof monitor.headers === "string") {
        const parseHeaders = JSON.parse(monitor.headers);
        if (
          parseHeaders &&
          typeof parseHeaders === "object" &&
          !Array.isArray(parseHeaders)
        ) {
          const headerObj = Object.assign({}, parseHeaders);
          if (Object.keys(headerObj).length === 0) {
            headers = new Headers();
          } else {
            headers = new Headers(headerObj);
          }
        }
      }

      // 发送请求
      response = await fetch(monitor.url, {
        method: monitor.method || "GET",
        headers: headers,
        body: monitor.method !== "GET" && monitor.method !== "HEAD" ? monitor.body || "" : undefined,
        signal: controller.signal,
      });

      // 清除超时
      clearTimeout(timeoutId);
    } catch (e) {
      // 处理请求错误
      error = e instanceof Error ? e.message : String(e);
      console.error(`监控 ${monitor.name} (${monitor.url}) 请求失败: ${error}`);

      return {
        success: false,
        status: "down",
        previous_status: previousStatus,
        error,
        responseTime: Date.now() - startTime,
        statusCode: null,
      };
    }

    // 计算响应时间
    const responseTime = Date.now() - startTime;

    // 检查状态码是否符合预期
    let isExpectedStatus = false;
    const expectedStatus = monitor.expected_status;

    // 处理范围状态码：如果预期状态码为个位数（1-5），则视为范围检查
    if (expectedStatus >= 1 && expectedStatus <= 5) {
      // 例如，当预期状态码为2时，匹配所有2xx状态码
      const statusCodeFirstDigit = Math.floor(response.status / 100);
      isExpectedStatus = statusCodeFirstDigit === expectedStatus;
    } else {
      // 精确匹配状态码
      isExpectedStatus = response.status === expectedStatus;
    }

    const status = isExpectedStatus ? "up" : "down";

    // 记录状态历史
    await repositories.insertMonitorStatusHistory(
      monitor.id,
      status,
      responseTime,
      response.status,
      error
    );

    console.log(`监控 ${monitor.name} (${monitor.url}) 检查完成.`);

    // 更新监控状态
    await repositories.updateMonitorStatus(monitor.id, status, responseTime);

    return {
      success: true,
      status,
      previous_status: previousStatus,
      responseTime,
      statusCode: response.status,
      error: isExpectedStatus
        ? null
        : `状态码不符合预期: ${
            response.status
          }, 预期: ${getExpectedStatusDisplay(expectedStatus)}`,
    };
  } catch (error) {
    console.error(`检查监控出错 (${monitor.name}):`, error);
    return {
      success: false,
      status: "error",
      previous_status: monitor.status,
      error: error instanceof Error ? error.message : String(error),
      responseTime: 0,
      statusCode: null,
    };
  }
}

export async function getAllMonitors() {
  const result = await repositories.getAllMonitors();

  return {
    success: true,
    monitors: result,
    status: 200,
  };
}

export async function getMonitorById(id: number) {
  const monitor = await repositories.getMonitorById(id);

  if (!monitor) {
    return { success: false, message: "监控不存在", status: 404 };
  }

  // 获取历史状态数据
  const historyResult = await repositories.getMonitorStatusHistoryIn24h(id);

  return {
    success: true,
    monitor: {
      ...monitor,
      history: historyResult,
    },
    status: 200,
  };
}

export async function createMonitor(data: any, userId: number) {
  try {
    // 验证必填字段
    if (!data.name || !data.url || !data.method) {
      return { success: false, message: "缺少必填字段", status: 400 };
    }

    // 如果headers是对象，则转换为字符串
    if (typeof data.headers !== "string") {
      data.headers = JSON.stringify(data.headers);
    }

    // 创建新监控
    const newMonitor = await repositories.createMonitor(
      data.name,
      data.url,
      data.method,
      data.interval || 60,
      data.timeout || 30,
      data.expected_status || 200,
      data.headers || {},
      data.body || "",
      userId
    );

    return {
      success: true,
      monitor: newMonitor,
      status: 201,
    };
  } catch (error) {
    console.error("创建监控错误:", error);
    return {
      success: false,
      message: "创建监控失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

export async function updateMonitor(id: number, data: any) {
  try {
    // 检查监控是否存在
    const monitor = await repositories.getMonitorById(id);

    if (!monitor) {
      return { success: false, message: "监控不存在", status: 404 };
    }

    // 准备更新数据
    const updateData: Partial<models.Monitor> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.method !== undefined) updateData.method = data.method;
    if (data.interval !== undefined) updateData.interval = data.interval;
    if (data.timeout !== undefined) updateData.timeout = data.timeout;
    if (data.expected_status !== undefined)
      updateData.expected_status = data.expected_status;
    if (data.headers !== undefined) updateData.headers = data.headers;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.responseTime !== undefined)
      updateData.response_time = data.responseTime;
    if (data.lastChecked !== undefined)
      updateData.last_checked = data.lastChecked;

    // 执行更新
    const updatedMonitor = await repositories.updateMonitorConfig(
      id,
      updateData
    );

    if (typeof updatedMonitor === "object" && "message" in updatedMonitor) {
      return {
        success: true,
        message: updatedMonitor.message,
        monitor: monitor,
        status: 200,
      };
    }

    return {
      success: true,
      monitor: updatedMonitor,
      status: 200,
    };
  } catch (error) {
    console.error("更新监控错误:", error);
    return {
      success: false,
      message: "更新监控失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

export async function deleteMonitor(id: number) {
  try {
    // 检查监控是否存在
    const monitor = await repositories.getMonitorById(id);

    if (!monitor) {
      return { success: false, message: "监控不存在", status: 404 };
    }

    // 执行通知设置删除
    const notificationResult = await NotificationService.deleteNotificationSettings(
      "monitor",
      id
    );
    if (!notificationResult.success) {
      console.error("删除监控通知设置失败:", notificationResult.message);
      // 继续执行监控删除，不影响主流程
    }

    // 执行monitor删除
    const result = await repositories.deleteMonitor(id);

    if (!result.success) {
      throw new Error("删除监控失败");
    }

    return {
      success: true,
      message: "监控已删除",
      status: 200,
    };
  } catch (error) {
    console.error("删除监控错误:", error);
    return {
      success: false,
      message: "删除监控失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

export async function getMonitorStatusHistoryById(
  id: number,
  userId: number,
  userRole: string
) {
  try {
    // 检查监控是否存在
    const monitor = await repositories.getMonitorById(id);

    if (!monitor) {
      return { success: false, message: "监控不存在", status: 404 };
    }

    // 检查权限
    if (userRole !== "admin" && monitor.created_by !== userId) {
      return { success: false, message: "无权访问此监控历史", status: 403 };
    }

    // 获取历史状态
    const historyResult = await repositories.getMonitorStatusHistoryIn24h(id);

    return {
      success: true,
      history: historyResult,
      status: 200,
    };
  } catch (error) {
    console.error("获取监控历史错误:", error);
    return {
      success: false,
      message: "获取监控历史失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

export async function getAllMonitorStatusHistory() {
  const result = await repositories.getAllMonitorStatusHistoryIn24h();
  return {
    success: true,
    history: result,
    status: 200,
  };
}

export async function manualCheckMonitor(id: number) {
  try {
    // 检查监控是否存在
    const monitor = await repositories.getMonitorById(id);

    if (!monitor) {
      return { success: false, message: "监控不存在", status: 404 };
    }

    // 使用抽象出来的通用检查监控函数进行检查
    const result = await checkMonitor(monitor);

    // 处理通知逻辑
    try {
      // 判断是否需要发送通知
      if (result.previous_status !== result.status) {
        console.log(
          `状态已变化: ${result.previous_status} -> ${result.status}`
        );

        // 检查是否需要发送通知
        console.log(`检查通知设置...`);
        const notificationCheck =
          await NotificationService.shouldSendNotification(
            "monitor",
            monitor.id,
            result.previous_status,
            result.status
          );

        console.log(
          `通知判断结果: shouldSend=${
            notificationCheck.shouldSend
          }, channels=${JSON.stringify(notificationCheck.channels)}`
        );

        if (
          notificationCheck.shouldSend &&
          notificationCheck.channels.length > 0
        ) {
          console.log(
            `监控 ${monitor.name} (ID: ${monitor.id}) 状态变更，正在发送通知...`
          );

          // 准备通知变量
          const variables = {
            name: monitor.name,
            status: result.status,
            previous_status: result.previous_status || "未知",
            time: new Date().toLocaleString("zh-CN"),
            response_time: `${result.responseTime}ms`,
            url: monitor.url,
            status_code: result.statusCode
              ? result.statusCode.toString()
              : "无",
            expected_status: monitor.expected_status.toString(),
            error: result.error || "无",
            details: `URL: ${monitor.url}\n响应时间: ${
              result.responseTime
            }ms\n状态码: ${result.statusCode || "无"}\n错误信息: ${
              result.error || "无"
            }`,
          };

          console.log(`通知变量: ${JSON.stringify(variables)}`);

          // 发送通知
          console.log(`开始发送通知...`);
          const notificationResult = await NotificationService.sendNotification(
            "monitor",
            monitor.id,
            variables,
            notificationCheck.channels
          );

          console.log(`通知发送结果: ${JSON.stringify(notificationResult)}`);

          if (notificationResult.success) {
            console.log(
              `监控 ${monitor.name} (ID: ${monitor.id}) 通知发送成功`
            );
          } else {
            console.error(
              `监控 ${monitor.name} (ID: ${monitor.id}) 通知发送失败`
            );
          }
        } else {
          console.log(
            `监控 ${monitor.name} (ID: ${monitor.id}) 状态变更，但不需要发送通知`
          );
        }
      } else {
        console.log(
          `监控 ${monitor.name} (ID: ${monitor.id}) 状态未变更，不发送通知`
        );
      }
    } catch (notificationError) {
      console.error("处理通知时出错:", notificationError);
      // 通知处理错误不影响主流程返回
    }

    return {
      success: true,
      message: "监控检查完成",
      result,
      status: 200,
    };
  } catch (error) {
    console.error("手动检查监控错误:", error);
    return {
      success: false,
      message: "手动检查监控失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

function getExpectedStatusDisplay(expectedStatus: number): string {
  if (expectedStatus >= 1 && expectedStatus <= 5) {
    return `${expectedStatus}xx`;
  }
  return String(expectedStatus);
}

export async function getMonitorDailyStats(id: number) {
  const result = await repositories.getMonitorDailyStatsById(id);

  return {
    success: true,
    dailyStats: result,
    message: "获取监控每日统计数据成功",
    status: 200,
  };
}

export async function getAllMonitorDailyStats() {
  // 获取所有监控
  const result = await repositories.getAllMonitorDailyStats();
  return {
    success: true,
    dailyStats: result,
    message: "获取所有监控的每日统计数据成功",
    status: 200,
  };
}

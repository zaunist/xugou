import { Monitor } from "../models";
import * as repositories from "../repositories";

export async function getDashboardData() {
  const monitors = await repositories.getAllMonitors();
  const agents = await repositories.getAllAgents();

  if (monitors.monitors && monitors.monitors.length > 0) {
    monitors.monitors.forEach((monitor: Monitor) => {
      if (typeof monitor.headers === "string") {
        try {
          monitor.headers = JSON.parse(monitor.headers);
        } catch (e) {
          monitor.headers = {};
        }
      }
    });
  }
  return {
    monitors: monitors,
    agents: agents,
  };
}

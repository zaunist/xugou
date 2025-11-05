import { Monitor } from '../models';
import * as repositories from '../repositories';

export async function getDashboardData(userId: number) {
  const monitors = await repositories.getAllMonitors(userId);
  const agents = await repositories.getAllAgents(userId);

  if (monitors && monitors.length > 0) {
    monitors.forEach((monitor: Monitor) => {
      if (typeof monitor.headers === 'string') {
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

import Docker from 'dockerode';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

const docker = new Docker();

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: Docker.ContainerInfo['Ports'];
  cpu: number;
  memory: number;
  created: number;
}

export const getContainerStats = async (): Promise<ContainerInfo[]> => {
  try {
    const containers = await docker.listContainers({ all: true });

    const containerStats = await Promise.all(
      containers.map(async (container) => {
        try {
          const containerInfo = await docker.getContainer(container.Id).inspect();

          // Get stats (simplified)
          let cpu = 0;
          let memory = 0;

          try {
            const stats = await docker.getContainer(container.Id).stats({ stream: false });
            if (stats && stats.cpu_stats && stats.memory_stats) {
              cpu = Math.round(stats.cpu_stats.cpu_usage.total_usage / stats.cpu_stats.system_cpu_usage * 100);
              memory = Math.round(stats.memory_stats.usage / stats.memory_stats.limit * 100);
            }
          } catch (statsError) {
            logger.warn(`Could not get stats for container ${container.Id}:`, statsError);
          }

          return {
            id: container.Id,
            name: container.Names[0].replace('/', ''),
            image: container.Image,
            status: container.Status,
            state: container.State,
            ports: container.Ports,
            cpu: cpu || 0,
            memory: memory || 0,
            created: container.Created
          };
        } catch (error) {
          logger.error(`Error inspecting container ${container.Id}:`, error);
          return null;
        }
      })
    );

    return containerStats.filter((container): container is ContainerInfo => container !== null);
  } catch (error) {
    logger.error('Error fetching container stats:', error);
    return [];
  }
};

export const getContainerLogs = async (containerId: string, lines: number = 100): Promise<string[]> => {
  try {
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: lines,
      timestamps: true
    });

    // Convert buffer to string and split by lines
    const logString = logs.toString('utf8');
    return logString.split('\n').filter((line: string) => line.trim());
  } catch (error) {
    logger.error(`Error fetching logs for container ${containerId}:`, error);
    throw error;
  }
};

export const startContainer = async (containerId: string): Promise<void> => {
  try {
    const container = docker.getContainer(containerId);
    await container.start();

    // Log the action
    await pool.query(
      'INSERT INTO container_actions (container_id, action, user_id) VALUES ($1, $2, $3)',
      [containerId, 'start', 'system']
    );

    logger.info(`Container ${containerId} started`);
  } catch (error) {
    logger.error(`Error starting container ${containerId}:`, error);
    throw error;
  }
};

export const stopContainer = async (containerId: string): Promise<void> => {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();

    // Log the action
    await pool.query(
      'INSERT INTO container_actions (container_id, action, user_id) VALUES ($1, $2, $3)',
      [containerId, 'stop', 'system']
    );

    logger.info(`Container ${containerId} stopped`);
  } catch (error) {
    logger.error(`Error stopping container ${containerId}:`, error);
    throw error;
  }
};

export const restartContainer = async (containerId: string): Promise<void> => {
  try {
    const container = docker.getContainer(containerId);
    await container.restart();

    // Log the action
    await pool.query(
      'INSERT INTO container_actions (container_id, action, user_id) VALUES ($1, $2, $3)',
      [containerId, 'restart', 'system']
    );

    logger.info(`Container ${containerId} restarted`);
  } catch (error) {
    logger.error(`Error restarting container ${containerId}:`, error);
    throw error;
  }
};

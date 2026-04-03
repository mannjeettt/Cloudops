jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('os', () => ({
  cpus: jest.fn(),
  totalmem: jest.fn(),
  freemem: jest.fn(),
  uptime: jest.fn(),
  loadavg: jest.fn()
}));

jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn()
  },
  statfsSync: jest.fn()
}));

import * as os from 'os';
import { promises as fsPromises, statfsSync } from 'fs';
import { pool } from '../config/database';
import { collectSystemMetrics, getMetricsHistory } from './metricsService';

describe('metricsService', () => {
  const mockedPool = pool as jest.Mocked<typeof pool>;
  const mockedOs = os as jest.Mocked<typeof os>;
  const mockedFsPromises = fsPromises as jest.Mocked<typeof fsPromises>;
  const mockedStatfsSync = statfsSync as jest.Mock;
  const originalPlatform = process.platform;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'linux'
    });
  });

  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: originalPlatform
    });
  });

  it('parameterizes metric history intervals and falls back to a safe default', async () => {
    mockedPool.query.mockResolvedValue({ rows: [{ id: 1 }] } as never);

    const rows = await getMetricsHistory('cpu', "1h' OR 1=1 --");

    expect(rows).toEqual([{ id: 1 }]);
    expect(mockedPool.query).toHaveBeenCalledWith(
      expect.stringContaining('AND created_at >= NOW() - $2::interval'),
      ['cpu', '1 hour']
    );
    expect(mockedPool.query).not.toHaveBeenCalledWith(
      expect.stringContaining("1h' OR 1=1 --"),
      expect.anything()
    );
  });

  it('collects live disk and network metrics instead of zero placeholders', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const release = jest.fn();
    mockedPool.connect.mockResolvedValue({ query, release } as never);

    mockedOs.cpus.mockReturnValue([
      { times: { user: 30, nice: 0, sys: 10, idle: 60, irq: 0 } },
      { times: { user: 20, nice: 0, sys: 20, idle: 60, irq: 0 } }
    ] as never);
    mockedOs.totalmem.mockReturnValue(16 * 1024 * 1024 * 1024);
    mockedOs.freemem.mockReturnValue(4 * 1024 * 1024 * 1024);
    mockedOs.uptime.mockReturnValue(1234);
    mockedOs.loadavg.mockReturnValue([0.5, 0.25, 0.1] as never);

    mockedStatfsSync.mockReturnValue({
      blocks: 100,
      bfree: 25,
      bsize: 1024 * 1024 * 1024
    });

    mockedFsPromises.readdir.mockResolvedValue(['eth0', 'lo', 'eth1'] as never);
    let snapshotPhase = 0;
    mockedFsPromises.readFile.mockImplementation(async (path: any) => {
      const firstSnapshot: Record<string, string> = {
        '/sys/class/net/eth0/statistics/rx_bytes': '1048576',
        '/sys/class/net/eth0/statistics/tx_bytes': '2097152',
        '/sys/class/net/eth1/statistics/rx_bytes': '3145728',
        '/sys/class/net/eth1/statistics/tx_bytes': '4194304'
      };
      const secondSnapshot: Record<string, string> = {
        '/sys/class/net/eth0/statistics/rx_bytes': '3145728',
        '/sys/class/net/eth0/statistics/tx_bytes': '4194304',
        '/sys/class/net/eth1/statistics/rx_bytes': '7340032',
        '/sys/class/net/eth1/statistics/tx_bytes': '8388608'
      };

      const dataset = snapshotPhase < 4 ? firstSnapshot : secondSnapshot;
      snapshotPhase += 1;

      return dataset[String(path)] ?? '0';
    });

    const metrics = await collectSystemMetrics();

    expect(metrics.disk).toEqual({
      used: 75,
      total: 100,
      percentage: 75
    });
    expect(metrics.network.rx).toBeGreaterThan(5);
    expect(metrics.network.rx).toBeLessThan(7);
    expect(metrics.network.tx).toBeGreaterThan(5);
    expect(metrics.network.tx).toBeLessThan(7);
    expect(query).toHaveBeenCalledTimes(3);
    expect(release).toHaveBeenCalled();
  });
});

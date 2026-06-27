export const isDemoMode = (): boolean => process.env.DEMO_MODE === 'true';

export const shouldUseRealDockerInDemo = (): boolean => process.env.REAL_DOCKER === 'true';

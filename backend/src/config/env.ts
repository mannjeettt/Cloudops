const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const getJwtSecret = (): string => getRequiredEnv('JWT_SECRET');

export const validateRequiredEnv = (): void => {
  getJwtSecret();
};

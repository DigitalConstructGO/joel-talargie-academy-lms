export const accountKeys = {
  all: ['account'] as const,
  profile: () => [...accountKeys.all, 'profile'] as const,
  sessions: () => [...accountKeys.all, 'sessions'] as const,
  avatar: (userId: string) => [...accountKeys.all, 'avatar', userId] as const,
  telegramStatus: () => [...accountKeys.all, 'telegram-status'] as const,
};

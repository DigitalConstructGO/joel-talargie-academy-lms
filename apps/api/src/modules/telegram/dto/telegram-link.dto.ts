export class TelegramLinkResponseDto {
  telegramUrl!: string;
  expiresAt!: string;
  alreadyLinked!: boolean;
}

export class TelegramStatusResponseDto {
  connected!: boolean;
  username?: string | null;
  linkedAt?: string | null;
}

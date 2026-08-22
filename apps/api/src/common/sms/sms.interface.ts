export interface SendSmsInput {
  recipientPhone: string;
  messageText: string;
  templateCode: string;
  deduplicationKey?: string;
}

export interface SendSmsResult {
  success: boolean;
  providerMessageId?: string;
  providerLogId?: string;
  responseCode?: string;
  error?: string;
}

export interface SmsProvider {
  sendSms(input: SendSmsInput): Promise<SendSmsResult>;
}

export const SMS_SERVICE = Symbol('SMS_SERVICE');

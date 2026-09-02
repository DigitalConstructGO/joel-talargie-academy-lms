import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendAiChatMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Message cannot be empty.' })
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters.' })
  message!: string;

  @IsOptional()
  @IsString()
  courseTitle?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

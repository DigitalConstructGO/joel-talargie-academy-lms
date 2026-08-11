import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/;
export class RegisterDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(80) firstName!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(80) lastName!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty()
  @Matches(passwordPattern, {
    message:
      'password must contain upper, lower, number and special characters',
  })
  password!: string;
  @ApiProperty() @IsString() confirmPassword!: string;
}
export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() password!: string;
}
export class TokenDto {
  @ApiProperty() @IsString() @MinLength(20) token!: string;
}
export class ResetPasswordDto extends TokenDto {
  @ApiProperty() @Matches(passwordPattern) password!: string;
  @ApiProperty() @IsString() confirmPassword!: string;
}
export class ForgotPasswordDto {
  @ApiProperty() @IsEmail() email!: string;
}
export class ChangePasswordDto {
  @ApiProperty() @IsString() currentPassword!: string;
  @ApiProperty() @Matches(passwordPattern) newPassword!: string;
  @ApiProperty() @IsString() confirmPassword!: string;
}

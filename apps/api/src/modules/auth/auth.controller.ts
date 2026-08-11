import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from './dto/auth.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser, GoogleProfile } from './interfaces/auth-user.interface';
import { GoogleAuthGuard } from './guards/google-auth.guard';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}
  private setCookie(response: Response, token: string) {
    response.cookie('refresh_token', token, {
      httpOnly: true,
      secure: this.config.get('AUTH_COOKIE_SECURE', false),
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Redirect to Google OAuth consent' })
  googleLogin() {
    return undefined;
  }
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Complete Google OAuth and redirect to the web application',
  })
  async googleCallback(
    @Req() request: Request & { user: GoogleProfile },
    @Res() response: Response,
  ) {
    const result = await this.auth.loginWithGoogle(request.user, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });
    this.setCookie(response, result.refreshToken);
    const redirect = new URL(
      '/auth/google/callback',
      this.config.getOrThrow<string>('WEB_URL'),
    );
    redirect.hash = new URLSearchParams({
      access_token: result.accessToken,
    }).toString();
    return response.redirect(redirect.toString());
  }
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a student account' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });
    this.setCookie(response, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Body() body: Partial<TokenDto>,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.refresh(
      body.token ?? request.cookies?.refresh_token,
    );
    this.setCookie(response, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }
  @HttpCode(200) @Post('logout') @ApiBearerAuth() async logout(
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.logout(request.cookies?.refresh_token, user);
    response.clearCookie('refresh_token', { path: '/' });
    return result;
  }
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('verify-email')
  verify(@Body() dto: TokenDto) {
    return this.auth.verifyEmail(dto.token);
  }
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(200)
  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('change-password')
  change(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user, dto);
  }
  @ApiBearerAuth() @Get('profile') profile(@CurrentUser() user: AuthUser) {
    return this.auth.profile(user.id);
  }
}

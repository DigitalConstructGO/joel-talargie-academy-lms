import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { secureToken } from '../utils/token.util';
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService) {
    super();
  }
  canActivate(context: ExecutionContext) {
    if (
      !this.config.get('GOOGLE_CLIENT_ID') ||
      !this.config.get('GOOGLE_CLIENT_SECRET')
    )
      throw new ServiceUnavailableException(
        'Google authentication is not configured',
      );
    const request = context
      .switchToHttp()
      .getRequest<Request & { oauthState?: string }>();
    const response = context.switchToHttp().getResponse<Response>();
    if (request.path.endsWith('/callback')) {
      if (
        !request.query.state ||
        request.query.state !== request.cookies?.google_oauth_state
      )
        throw new UnauthorizedException('Invalid Google OAuth state');
      response.clearCookie('google_oauth_state', {
        path: '/api/v1/auth/google',
      });
    } else {
      request.oauthState = secureToken();
      const secure = Boolean(
        this.config.get<boolean>('AUTH_COOKIE_SECURE', false),
      );
      response.cookie('google_oauth_state', request.oauthState, {
        httpOnly: true,
        secure,
        sameSite: secure ? 'none' : 'lax',
        path: '/api/v1/auth/google',
        maxAge: 10 * 60 * 1000,
      });
    }
    return super.canActivate(context);
  }
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { oauthState?: string }>();
    return { scope: ['openid', 'email', 'profile'], state: request.oauthState };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import type { GoogleProfile } from '../interfaces/auth-user.interface';
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: (config.get('GOOGLE_CLIENT_ID') || 'disabled').trim(),
      clientSecret: (config.get('GOOGLE_CLIENT_SECRET') || 'disabled').trim(),
      callbackURL: config.getOrThrow('GOOGLE_CALLBACK_URL'),
      scope: ['openid', 'email', 'profile'],
    });
  }
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0];
    const raw = profile._json as {
      email_verified?: boolean;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };
    if (!email?.value || raw.email_verified !== true)
      return done(
        new UnauthorizedException('Google account must have a verified email'),
      );
    const result: GoogleProfile = {
      googleId: profile.id,
      email: email.value.trim().toLowerCase(),
      firstName: profile.name?.givenName ?? raw.given_name ?? '',
      lastName: profile.name?.familyName ?? raw.family_name ?? '',
      avatarUrl: profile.photos?.[0]?.value ?? raw.picture,
      emailVerified: true,
    };
    done(null, result);
  }
}

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('oauth.google.clientId') || 'dummy-client-id';
    const clientSecret = configService.get<string>('oauth.google.clientSecret') || 'dummy-client-secret';
    
    super({
      clientID,
      clientSecret,
      callbackURL: `${configService.get<string>('apiUrl')}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;

    const user = await this.authService.validateOAuthUser(
      AuthProvider.GOOGLE,
      id,
      emails?.[0]?.value || null,
      displayName || null,
      photos?.[0]?.value || null,
    );

    done(null, user);
  }
}

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('oauth.facebook.clientId') || 'dummy-client-id';
    const clientSecret = configService.get<string>('oauth.facebook.clientSecret') || 'dummy-client-secret';
    
    super({
      clientID,
      clientSecret,
      callbackURL: `${configService.get<string>('apiUrl')}/auth/facebook/callback`,
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any) => void,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;

    const user = await this.authService.validateOAuthUser(
      AuthProvider.FACEBOOK,
      id,
      emails?.[0]?.value || null,
      displayName || null,
      photos?.[0]?.value || null,
    );

    done(null, user);
  }
}

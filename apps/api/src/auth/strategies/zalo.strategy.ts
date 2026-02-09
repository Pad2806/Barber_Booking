import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthProvider } from '@prisma/client';

/**
 * Zalo Strategy for Mini App authentication
 * 
 * Flow:
 * 1. Zalo Mini App calls Zalo SDK to get access token
 * 2. Mini App sends access token to our API
 * 3. We validate token with Zalo API
 * 4. Create/update user and return JWT tokens
 */
@Injectable()
export class ZaloStrategy extends PassportStrategy(Strategy, 'zalo') {
  private readonly zaloApiUrl = 'https://graph.zalo.me';

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super();
  }

  async validate(req: any): Promise<any> {
    const { accessToken, code } = req.body;

    if (!accessToken && !code) {
      throw new UnauthorizedException('Zalo access token or code is required');
    }

    try {
      let zaloAccessToken = accessToken;

      // If we have a code, exchange it for access token
      if (code && !accessToken) {
        zaloAccessToken = await this.exchangeCodeForToken(code);
      }

      // Get user info from Zalo
      const zaloUser = await this.getZaloUserInfo(zaloAccessToken);

      // Validate or create user
      const user = await this.authService.validateOAuthUser(
        AuthProvider.ZALO,
        zaloUser.id,
        null, // Zalo doesn't always provide email
        zaloUser.name || null,
        zaloUser.picture?.data?.url || null,
      );

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid Zalo authentication');
    }
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    const appId = this.configService.get<string>('oauth.zalo.appId');
    const appSecret = this.configService.get<string>('oauth.zalo.appSecret');

    const response = await fetch(
      `https://oauth.zaloapp.com/v4/access_token?app_id=${appId}&code=${code}&code_verifier=&grant_type=authorization_code`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          secret_key: appSecret ?? '',
        },
      },
    );

    const data = await response.json();

    if (data.error) {
      throw new UnauthorizedException('Failed to exchange Zalo code');
    }

    return data.access_token;
  }

  private async getZaloUserInfo(accessToken: string): Promise<any> {
    const response = await fetch(`${this.zaloApiUrl}/v2.0/me?fields=id,name,picture`, {
      headers: {
        access_token: accessToken,
      },
    });

    const data = await response.json();

    if (data.error) {
      throw new UnauthorizedException('Failed to get Zalo user info');
    }

    return data;
  }
}

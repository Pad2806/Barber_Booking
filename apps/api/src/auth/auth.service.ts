import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthProvider, User } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  private resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.resend = new Resend(this.configService.get<string>('resend.apiKey'));
  }

  async register(dto: RegisterDto): Promise<TokenResponse> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const orConditions: any[] = [];
    if (dto.email) orConditions.push({ email: dto.email });
    if (dto.phone) orConditions.push({ phone: dto.phone });

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: orConditions },
    });

    if (existingUser) {
      throw new ConflictException('Email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // If no email provided, generate a placeholder from phone
    const email = dto.email || `${dto.phone}@phone.local`;

    const user = await this.prisma.user.create({
      data: {
        email,
        phone: dto.phone,
        password: hashedPassword,
        name: dto.name || dto.phone,
        authProvider: AuthProvider.LOCAL,
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<TokenResponse> {
    const identifier = dto.email || dto.phone;
    if (!identifier) {
      throw new BadRequestException('Email or phone is required');
    }
    const user = await this.validateUser(identifier, dto.password);
    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: email }, // Allow login with phone
        ],
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return user;
  }

  async validateOAuthUser(
    provider: AuthProvider,
    providerId: string,
    email: string | null,
    name: string | null,
    avatar: string | null,
  ): Promise<User> {
    const providerIdField = `${provider.toLowerCase()}Id` as 'googleId' | 'facebookId' | 'zaloId';

    // Check if user exists with this provider ID
    let user = await this.prisma.user.findFirst({
      where: { [providerIdField]: providerId },
    });

    if (user) {
      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          ...(name && !user.name ? { name } : {}),
          ...(avatar && !user.avatar ? { avatar } : {}),
        },
      });
      return user;
    }

    // Check if user exists with this email
    if (email) {
      user = await this.prisma.user.findUnique({ where: { email } });

      if (user) {
        // Link OAuth provider to existing account
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            [providerIdField]: providerId,
            lastLoginAt: new Date(),
            ...(avatar && !user.avatar ? { avatar } : {}),
          },
        });
        return user;
      }
    }

    // Create new user
    user = await this.prisma.user.create({
      data: {
        email,
        name,
        avatar,
        [providerIdField]: providerId,
        authProvider: provider,
        isVerified: true, // OAuth users are pre-verified
      },
    });

    return user;
  }

  async generateTokens(user: User): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email ?? '',
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    return this.generateTokens(storedToken.user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
  }

  // ============== Password Reset ==============

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link will be sent' };
    }

    // Delete any existing reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>('urls.web') || this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const fromEmail = this.configService.get<string>('resend.from') || 'ReetroBarberShop <onboarding@resend.dev>';

    // Send email via Resend HTTP API (bypasses all firewall/SMTP port blocks)
    try {
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: 'ReetroBarberShop - Đặt lại mật khẩu',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #1a1a1a; margin: 0;">Reetro<span style="color: #cda873;">BarberShop</span></h1>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
              <h2 style="color: #333; margin-top: 0;">Yêu cầu đặt lại mật khẩu</h2>
              <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Chào ${user.name || 'bạn'},<br><br>
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ReetroBarberShop của bạn.
                Vui lòng nhấn vào nút bên dưới để tiến hành đặt mật khẩu mới. Link này sẽ hết hạn sau 1 giờ.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #cda873; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Đặt Lại Mật Khẩu
                </a>
              </div>
              <p style="color: #777; font-size: 14px; text-align: center;">
                Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} ReetroBarberShop. All rights reserved.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Resend API error:', error);
        throw new InternalServerErrorException(
          `Không thể gửi email: ${error.message}`
        );
      }

      console.log(`Password reset email sent to ${email} via Resend (ID: ${data?.id})`);
    } catch (error: any) {
      if (error instanceof InternalServerErrorException) throw error;
      console.error('Failed to send password reset email:', error);
      throw new InternalServerErrorException(
        `Không thể gửi email: ${error.message || 'Lỗi không xác định'}`
      );
    }

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async verifyResetToken(token: string): Promise<{ valid: boolean }> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.usedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    return { valid: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.usedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all refresh tokens for security
    await this.prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    return { message: 'Password reset successfully' };
  }
}

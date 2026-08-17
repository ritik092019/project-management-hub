import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existing) {
      throw new ConflictException(`User with email "${registerDto.email}" already exists`);
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        passwordHash,
        role: registerDto.role || 'DEVELOPER',
        department: registerDto.department,
        title: registerDto.title,
        avatar: registerDto.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    const { passwordHash: _, refreshTokenHash: __, resetTokenHash: ___, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled. Contact your administrator.');
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    const { passwordHash: _, refreshTokenHash: __, resetTokenHash: ___, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET') || 'super_secret_jwt_key_project_hub_2026',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshTokenHash || !user.isActive) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const refreshMatches = await bcrypt.compare(refreshTokenDto.refreshToken, user.refreshTokenHash);

      if (!refreshMatches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      return {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'super_secret_jwt_key_project_hub_2026',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User inactive or invalid');
      }

      const { passwordHash: _, refreshTokenHash: __, resetTokenHash: ___, ...sanitizedUser } = user;
      return sanitizedUser;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Return success to prevent email enumeration
      return { message: 'If email exists, reset instructions have been generated.', resetCode: '123456' };
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenHash = await bcrypt.hash(resetCode, 10);
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash, resetTokenExpires },
    });

    return {
      message: 'Password reset code generated successfully',
      resetCode, // Exposed for demonstration/testing
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: resetPasswordDto.email },
    });

    if (!user || !user.resetTokenHash || !user.resetTokenExpires) {
      throw new BadRequestException('Invalid or expired reset token request');
    }

    if (new Date() > user.resetTokenExpires) {
      throw new BadRequestException('Password reset code has expired');
    }

    const codeMatches = await bcrypt.compare(resetPasswordDto.resetToken, user.resetTokenHash);

    if (!codeMatches) {
      throw new BadRequestException('Invalid password reset code');
    }

    const newPasswordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetTokenHash: null,
        resetTokenExpires: null,
      },
    });

    return { message: 'Password reset successfully. You may now log in.' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found');
    }

    const matches = await bcrypt.compare(changePasswordDto.oldPassword, user.passwordHash);

    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _, refreshTokenHash: __, resetTokenHash: ___, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      include: { team: true },
    });

    const { passwordHash: _, refreshTokenHash: __, resetTokenHash: ___, ...sanitizedUser } = user;
    return { user: sanitizedUser };
  }

  async updateUserStatus(userId: string, updateUserStatusDto: UpdateUserStatusDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserStatusDto,
    });

    const { passwordHash: _, refreshTokenHash: __, resetTokenHash: ___, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const secret = this.configService.get<string>('JWT_SECRET') || 'super_secret_jwt_key_project_hub_2026';

    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: '1d' as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: '7d' as any,
    });

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }
}

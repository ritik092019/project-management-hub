import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../email/mail.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly adminEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.adminEmail = this.mailService.getAdminEmail();
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException(`User with email "${registerDto.email}" already exists`);
    }

    const isAdminUser = registerDto.email.toLowerCase() === this.adminEmail.toLowerCase();

    // Sole Admin Enforcement: Only adminEmail can be assigned ADMIN role
    let assignedRole: UserRole = UserRole.DEVELOPER;
    if (isAdminUser) {
      assignedRole = UserRole.ADMIN;
    } else if (registerDto.role) {
      if (registerDto.role === UserRole.ADMIN) {
        throw new ForbiddenException(`Only the designated sole admin (${this.adminEmail}) can have the ADMIN role.`);
      }
      assignedRole = registerDto.role as UserRole;
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase(),
        name: registerDto.name,
        passwordHash,
        role: assignedRole,
        department: registerDto.department,
        title: registerDto.title,
        avatar: registerDto.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        isActive: true,
        isApproved: true,
      },
    });

    const { passwordHash: _, refreshTokenHash: __, resetTokenHash: ___, ...sanitizedUser } = user;

    // Issue tokens directly so user can log in immediately
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return {
      message: 'Account registered successfully! You are now logged in.',
      user: sanitizedUser,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isAdminUser = user.role === UserRole.ADMIN || user.email.toLowerCase() === this.adminEmail.toLowerCase();

    // Auto-approve user on login
    if (!user.isApproved || !user.isActive) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isApproved: true, isActive: true },
      });
      user.isApproved = true;
      user.isActive = true;
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

  async processApprovalRequest(token: string, action: string) {
    const request = await this.prisma.pendingRequest.findUnique({
      where: { token },
    });

    if (!request) {
      throw new BadRequestException('Approval token is invalid or does not exist.');
    }

    if (request.status !== 'PENDING') {
      return {
        alreadyProcessed: true,
        message: `This request has already been ${request.status.toLowerCase()}.`,
        status: request.status,
        type: request.type,
      };
    }

    const isApprove = action.toLowerCase() === 'approve';

    if (request.type === 'USER_REGISTRATION') {
      if (isApprove) {
        await this.prisma.user.update({
          where: { id: request.targetId! },
          data: { isActive: true, isApproved: true },
        });

        await this.prisma.pendingRequest.update({
          where: { id: request.id },
          data: { status: 'APPROVED' },
        });

        const targetUser = await this.prisma.user.findUnique({ where: { id: request.targetId! } });
        if (targetUser) {
          await this.mailService.sendRegistrationApprovedNotification({
            registrantEmail: targetUser.email,
            registrantName: targetUser.name,
          });
        }

        return {
          success: true,
          message: 'User registration request ACCEPTED successfully! The user is now active and can log in.',
          type: 'USER_REGISTRATION',
          status: 'APPROVED',
        };
      } else {
        await this.prisma.pendingRequest.update({
          where: { id: request.id },
          data: { status: 'REJECTED' },
        });

        await this.prisma.user.delete({ where: { id: request.targetId! } }).catch(() => null);

        return {
          success: true,
          message: 'User registration request REJECTED.',
          type: 'USER_REGISTRATION',
          status: 'REJECTED',
        };
      }
    }

    if (request.type === 'PROJECT_CREATE') {
      if (isApprove) {
        const payload = JSON.parse(request.payload || '{}');
        const project = await this.prisma.project.create({
          data: {
            name: payload.name,
            summary: payload.summary,
            description: payload.description,
            category: payload.category || 'WEB_APP',
            ownerId: payload.ownerId,
            status: payload.status || 'IN_PROGRESS',
            priority: payload.priority || 'MEDIUM',
            githubUrl: payload.githubUrl,
            liveUrl: payload.liveUrl,
            demoUrl: payload.demoUrl,
            docsUrl: payload.docsUrl,
            imageUrl: payload.imageUrl,
          },
        });

        await this.prisma.pendingRequest.update({
          where: { id: request.id },
          data: { status: 'APPROVED' },
        });

        return {
          success: true,
          message: `Project "${project.name}" creation request ACCEPTED and project published!`,
          type: 'PROJECT_CREATE',
          status: 'APPROVED',
          projectId: project.id,
        };
      } else {
        await this.prisma.pendingRequest.update({
          where: { id: request.id },
          data: { status: 'REJECTED' },
        });

        return {
          success: true,
          message: 'Project creation request REJECTED.',
          type: 'PROJECT_CREATE',
          status: 'REJECTED',
        };
      }
    }

    if (request.type === 'PROJECT_DELETE') {
      if (isApprove) {
        await this.prisma.project.delete({
          where: { id: request.targetId! },
        }).catch(() => null);

        await this.prisma.pendingRequest.update({
          where: { id: request.id },
          data: { status: 'APPROVED' },
        });

        return {
          success: true,
          message: 'Project deletion request ACCEPTED and project removed from database.',
          type: 'PROJECT_DELETE',
          status: 'APPROVED',
        };
      } else {
        await this.prisma.pendingRequest.update({
          where: { id: request.id },
          data: { status: 'REJECTED' },
        });

        return {
          success: true,
          message: 'Project deletion request REJECTED. Project remains active.',
          type: 'PROJECT_DELETE',
          status: 'REJECTED',
        };
      }
    }

    throw new BadRequestException('Unknown request type');
  }

  async getPendingRequests() {
    return this.prisma.pendingRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
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

      const userId = payload?.sub || payload?.id;
      let user = null;
      if (userId) {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
      } else if (payload?.email) {
        user = await this.prisma.user.findUnique({
          where: { email: payload.email },
        });
      }

      if (!user || !user.refreshTokenHash || !user.isActive || !user.isApproved) {
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

      const userId = payload?.sub || payload?.id;
      let user = null;
      if (userId) {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
      } else if (payload?.email) {
        user = await this.prisma.user.findUnique({
          where: { email: payload.email },
        });
      }

      if (!user || !user.isActive || !user.isApproved) {
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
      where: { email: forgotPasswordDto.email.toLowerCase() },
    });

    if (!user) {
      return { message: 'If email exists, reset instructions have been generated.', resetCode: '123456' };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenHash = await bcrypt.hash(resetCode, 10);
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash, resetTokenExpires },
    });

    return {
      message: 'Password reset code generated successfully',
      resetCode,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: resetPasswordDto.email.toLowerCase() },
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
    const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new NotFoundException('User not found');

    if (updateUserStatusDto.role === UserRole.ADMIN && targetUser.email.toLowerCase() !== this.adminEmail.toLowerCase()) {
      throw new ForbiddenException(`Only the designated sole admin (${this.adminEmail}) can have the ADMIN role.`);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserStatusDto,
    });

    const { passwordHash: _, refreshTokenHash: __, resetTokenHash: ___, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, id: userId, email, role };
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

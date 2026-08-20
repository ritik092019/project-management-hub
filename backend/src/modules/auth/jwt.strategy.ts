import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub?: string;
  id?: string;
  email?: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super_secret_jwt_key_project_hub_2026',
    });
  }

  async validate(payload: JwtPayload) {
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

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    const { passwordHash, refreshTokenHash, resetTokenHash, ...result } = user;
    return result;
  }
}

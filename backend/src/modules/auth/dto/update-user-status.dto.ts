import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiPropertyOptional({ example: false, description: 'Enable or disable account' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.SUPERVISOR })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@company.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.DEVELOPER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ example: 'Full Stack Engineer' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'https://avatar.url/john.png' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: 'team-uuid-here' })
  @IsString()
  @IsOptional()
  teamId?: string;
}

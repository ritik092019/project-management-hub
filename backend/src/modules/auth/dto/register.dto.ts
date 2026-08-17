import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'developer@team.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: 'Alex Chen' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.DEVELOPER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Frontend & Platform' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ example: 'Senior Fullstack Developer' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1' })
  @IsString()
  @IsOptional()
  avatar?: string;
}

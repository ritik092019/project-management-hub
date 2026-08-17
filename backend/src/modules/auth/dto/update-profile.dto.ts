import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Alex Chen' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Frontend & Platform' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ example: 'Staff Fullstack Architect' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1' })
  @IsString()
  @IsOptional()
  avatar?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ example: 'Core Platform Engineering' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Team focused on platform architecture and core APIs' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsString()
  @IsOptional()
  department?: string;
}

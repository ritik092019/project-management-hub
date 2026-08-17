import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ProjectStatus, ProjectCategory, Priority } from '@prisma/client';

export class AnalyticsFilterDto {
  @ApiPropertyOptional({ description: 'Filter start date (YYYY-MM-DD or ISO)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date (YYYY-MM-DD or ISO)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter start date alias (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter end date alias (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Filter by owner/developer ID or name' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by owner alias' })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({ description: 'Filter by supervisor ID or name' })
  @IsOptional()
  @IsString()
  supervisorId?: string;

  @ApiPropertyOptional({ description: 'Filter by supervisor alias' })
  @IsOptional()
  @IsString()
  supervisor?: string;

  @ApiPropertyOptional({ description: 'Filter by team ID or name' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({ description: 'Filter by team alias' })
  @IsOptional()
  @IsString()
  team?: string;

  @ApiPropertyOptional({ description: 'Filter by project status', enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Filter by project category', enum: ProjectCategory })
  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @ApiPropertyOptional({ description: 'Filter by project priority', enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Filter search keyword' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by technology name or IDs (comma separated)' })
  @IsOptional()
  @IsString()
  tech?: string;

  @ApiPropertyOptional({ description: 'Filter by technology stack alias' })
  @IsOptional()
  @IsString()
  techStack?: string;
}

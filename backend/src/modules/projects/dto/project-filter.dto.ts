import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus, ApprovalStatus, Priority, ProjectCategory } from '@prisma/client';

export class ProjectFilterDto {
  @ApiPropertyOptional({ description: 'Search term for name, summary, or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by owner ID or name/email' })
  @IsString()
  @IsOptional()
  owner?: string;

  @ApiPropertyOptional({ description: 'Filter by owner ID' })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by supervisor ID or name/email' })
  @IsString()
  @IsOptional()
  supervisor?: string;

  @ApiPropertyOptional({ description: 'Filter by supervisor ID' })
  @IsString()
  @IsOptional()
  supervisorId?: string;

  @ApiPropertyOptional({ description: 'Filter by team ID or name' })
  @IsString()
  @IsOptional()
  team?: string;

  @ApiPropertyOptional({ description: 'Filter by team ID' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ description: 'Filter by technology name or ID (supports comma-separated)' })
  @IsString()
  @IsOptional()
  technology?: string;

  @ApiPropertyOptional({ description: 'Filter by technology tag' })
  @IsString()
  @IsOptional()
  tech?: string;

  @ApiPropertyOptional({ enum: ProjectCategory })
  @IsEnum(ProjectCategory)
  @IsOptional()
  category?: ProjectCategory;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ApprovalStatus })
  @IsEnum(ApprovalStatus)
  @IsOptional()
  approvalStatus?: ApprovalStatus;

  @ApiPropertyOptional({ enum: Priority })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Specific deployment date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  deploymentDate?: string;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD or ISO)' })
  @IsString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'Start date filter alias' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD or ISO)' })
  @IsString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ description: 'End date filter alias' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'deploymentDate', description: 'Sort field: deploymentDate, name, createdAt, testCoverage, linesOfCode, priority' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}

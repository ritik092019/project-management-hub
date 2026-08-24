import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { ProjectStatus, ApprovalStatus, Priority, ProjectCategory } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ example: 'AI Project Manager' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'AI-assisted project tracking tool' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ example: 'Detailed description of architecture and goals' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: ProjectCategory, default: ProjectCategory.WEB_APP })
  @IsEnum(ProjectCategory)
  @IsOptional()
  category?: ProjectCategory;

  @ApiPropertyOptional({ example: 'user-uuid-owner' })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ example: 'Ritika Asthana' })
  @IsString()
  @IsOptional()
  owner?: string;

  @ApiPropertyOptional({ example: 'Ritika Asthana' })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiPropertyOptional({ example: 'ritika@team.com' })
  @IsString()
  @IsOptional()
  ownerEmail?: string;

  @ApiPropertyOptional({ example: 'user-uuid-supervisor' })
  @IsString()
  @IsOptional()
  supervisorId?: string;

  @ApiPropertyOptional({ example: 'Alok kumar' })
  @IsString()
  @IsOptional()
  supervisor?: string;

  @ApiPropertyOptional({ example: 'Alok kumar' })
  @IsString()
  @IsOptional()
  supervisorName?: string;

  @ApiPropertyOptional({ example: 'alok@team.com' })
  @IsString()
  @IsOptional()
  supervisorEmail?: string;

  @ApiPropertyOptional({ example: 'team-uuid' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.IN_PROGRESS })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ApprovalStatus, default: ApprovalStatus.PENDING_REVIEW })
  @IsEnum(ApprovalStatus)
  @IsOptional()
  approvalStatus?: ApprovalStatus;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({ example: '2026-10-15' })
  @IsString()
  @IsOptional()
  deploymentDate?: string;

  @ApiPropertyOptional({ example: '2026-10-10' })
  @IsString()
  @IsOptional()
  expectedCompletionDate?: string;

  @ApiPropertyOptional({ example: '2026-10-15' })
  @IsString()
  @IsOptional()
  actualCompletionDate?: string;

  @ApiPropertyOptional({ example: 'https://github.com/org/repo' })
  @IsString()
  @IsOptional()
  githubUrl?: string;

  @ApiPropertyOptional({ example: 'https://app.domain.com' })
  @IsString()
  @IsOptional()
  liveUrl?: string;

  @ApiPropertyOptional({ example: 'https://demo.domain.com' })
  @IsString()
  @IsOptional()
  demoUrl?: string;

  @ApiPropertyOptional({ example: 'https://docs.domain.com' })
  @IsString()
  @IsOptional()
  docsUrl?: string;

  @ApiPropertyOptional({ example: 'https://docs.domain.com' })
  @IsString()
  @IsOptional()
  documentationUrl?: string;

  @ApiPropertyOptional({ example: 92.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  testCoverage?: number;

  @ApiPropertyOptional({ example: 15400 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  linesOfCode?: number;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-2' })
  @IsString()
  @IsOptional()
  architectureUrl?: string;

  @ApiPropertyOptional({ example: ['tech-uuid-1', 'tech-uuid-2'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technologyIds?: string[];

  @ApiPropertyOptional({ example: ['React 19', 'TypeScript'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  techStack?: string[];
}

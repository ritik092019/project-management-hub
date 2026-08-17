import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus, ApprovalStatus, Priority } from '@prisma/client';

export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  summary: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  ownerId: string;

  @ApiPropertyOptional()
  supervisorId?: string;

  @ApiPropertyOptional()
  teamId?: string;

  @ApiPropertyOptional()
  deploymentDate?: Date;

  @ApiProperty({ enum: ProjectStatus })
  status: ProjectStatus;

  @ApiProperty({ enum: ApprovalStatus })
  approvalStatus: ApprovalStatus;

  @ApiProperty({ enum: Priority })
  priority: Priority;

  @ApiPropertyOptional()
  githubUrl?: string;

  @ApiPropertyOptional()
  liveUrl?: string;

  @ApiPropertyOptional()
  demoUrl?: string;

  @ApiPropertyOptional()
  docsUrl?: string;

  @ApiProperty()
  testCoverage: number;

  @ApiProperty()
  linesOfCode: number;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  architectureUrl?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

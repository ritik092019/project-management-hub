import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProjectStatus, ApprovalStatus } from '@prisma/client';

export class UpdateProjectStatusDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ApprovalStatus })
  @IsEnum(ApprovalStatus)
  @IsOptional()
  approvalStatus?: ApprovalStatus;

  @ApiPropertyOptional({ example: 'Feedback on status update' })
  @IsString()
  @IsOptional()
  feedbackText?: string;
}

export class AssignSupervisorDto {
  @ApiProperty({ example: 'user-uuid-supervisor', description: 'User ID of the supervisor to assign' })
  @IsString()
  @IsNotEmpty()
  supervisorId: string;
}

export class AssignTeamDto {
  @ApiProperty({ example: 'team-uuid', description: 'Team ID to assign to the project' })
  @IsString()
  @IsNotEmpty()
  teamId: string;
}

export class ManageTechnologiesDto {
  @ApiProperty({ example: ['tech-uuid-1', 'tech-uuid-2'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  technologyIds: string[];
}

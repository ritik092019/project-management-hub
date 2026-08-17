import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsInt, Min, Max, IsArray } from 'class-validator';
import { ApprovalStatus } from '@prisma/client';

export class CreateReviewDto {
  @ApiProperty({ description: 'Target approval status transition', enum: ApprovalStatus })
  @IsNotEmpty()
  @IsEnum(ApprovalStatus)
  approvalStatus: ApprovalStatus;

  @ApiProperty({ description: 'Supervisor feedback text / review note' })
  @IsNotEmpty()
  @IsString()
  feedbackText: string;

  @ApiPropertyOptional({ description: 'Rating scale 1-5', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'List of changes requested', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  changesRequestedList?: string[];
}

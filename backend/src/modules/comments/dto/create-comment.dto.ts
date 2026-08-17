import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text content' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Optional parent comment ID for threaded replies' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

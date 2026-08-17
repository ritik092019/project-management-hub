import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TechnologyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

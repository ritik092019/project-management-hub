import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiPropertyOptional()
  department?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  teamId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

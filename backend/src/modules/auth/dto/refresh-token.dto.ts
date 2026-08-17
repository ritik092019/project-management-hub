import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh JWT token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

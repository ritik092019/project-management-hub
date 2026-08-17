import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'NewSecretPassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword: string;
}

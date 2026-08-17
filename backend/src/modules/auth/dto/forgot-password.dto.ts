import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'developer@team.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Authentication & Profile')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration with bcrypt password hashing' })
  @ApiResponse({ status: 201, description: 'User created successfully with access and refresh tokens' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login issuing access and refresh JWT tokens' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid email or password / Account disabled' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiBearerAuth()
  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout invalidating stored refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id);
  }

  @Public()
  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh expired access token using valid refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Public()
  @Get('auth/validate')
  @ApiOperation({ summary: 'Validate access token passed in authorization header' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid' })
  async validateToken(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.validateToken(token);
  }

  @Public()
  @Post('auth/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiResponse({ status: 200, description: 'Reset code generated' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('auth/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using valid reset token/code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset code' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiBearerAuth()
  @Get('auth/me')
  @ApiOperation({ summary: 'Get profile details of logged in user' })
  @ApiResponse({ status: 200, description: 'Current authenticated user profile' })
  async me(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.id);
  }

  @ApiBearerAuth()
  @Put('auth/profile')
  @ApiOperation({ summary: 'Update profile details of logged in user' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@CurrentUser() user: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @ApiBearerAuth()
  @Post('auth/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for logged in user' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Current password incorrect' })
  async changePassword(@CurrentUser() user: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Admin account status management (Enable/Disable/Change Role)' })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiResponse({ status: 200, description: 'User account status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin role required' })
  async updateUserStatus(@Param('id') id: string, @Body() updateUserStatusDto: UpdateUserStatusDto) {
    return this.authService.updateUserStatus(id, updateUserStatusDto);
  }
}

import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.auth.requestPasswordReset(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    //console.log(dto);
    return this.auth.resetPassword(dto.token, dto.password);
  }

  // backend/src/auth/auth.controller.ts

  @Get('profile')
  @UseGuards(JwtAuthGuard) // This ensures only logged-in users can see this
  async getProfile(@Request() req) {
    const userId = req.user.sub;
    return this.auth.getUserProfile(userId);
  }
}

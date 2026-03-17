// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth') 
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login') 
  @HttpCode(HttpStatus.OK) 
  async login(@Body() loginDto: any) {
    return this.authService.login(loginDto.username, loginDto.password);
  }
}
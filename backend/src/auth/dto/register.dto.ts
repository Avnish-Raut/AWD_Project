import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// Only USER and ORG are self-registerable — ADMIN is assigned manually
export enum RegisterRole {
  USER = 'USER',
  ORG = 'ORG',
}

export class RegisterDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(RegisterRole)
  role?: RegisterRole;
}

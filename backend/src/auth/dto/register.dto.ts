import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Matches,
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

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
  })
  password: string;

  @IsOptional()
  @IsEnum(RegisterRole)
  role?: RegisterRole;
}

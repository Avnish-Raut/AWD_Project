import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  current_password?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  new_password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar_url?: string;
}

import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email' })
  email?: string;

  @IsOptional()
  @MaxLength(255, { message: 'Avatar URL cannot exceed 255 characters' })
  avatar_url?: string;

  @IsOptional()
  @IsString()
  current_password?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'New password must contain 1 uppercase, 1 lowercase, 1 number, and 1 special character',
  })
  new_password?: string;
}

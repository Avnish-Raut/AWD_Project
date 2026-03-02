import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  event_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

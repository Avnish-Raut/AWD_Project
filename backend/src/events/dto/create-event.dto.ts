import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  event_date: string;

  @IsString()
  @MaxLength(100)
  location: string;

  @IsInt()
  @Min(1)
  capacity: number;
}

import { Status } from '@/lib/shared/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

export class PageRolesDto extends PaginationParams {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'code must be a string' })
  @IsNotEmpty({ message: 'code cannot be empty' })
  code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name?: string;

  @ApiProperty({
    required: false,
    enum: Object.values(Status),
    type: String,
  })
  @IsOptional()
  @IsEnum(Status, { message: 'Status must be a valid enum value' })
  status?: Status;
}

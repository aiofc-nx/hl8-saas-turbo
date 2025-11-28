import { Status } from '@/lib/shared/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

export class PageUsersDto extends PaginationParams {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Nickname must be a string' })
  @IsNotEmpty({ message: 'Nickname cannot be empty' })
  nickName?: string;

  @ApiProperty({
    required: false,
    enum: Object.values(Status),
    type: String,
  })
  @IsOptional()
  @IsEnum(Status, { message: 'Status must be a valid enum value' })
  status?: Status;
}

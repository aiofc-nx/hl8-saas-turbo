import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator';

/**
 * 路由分配数据传输对象
 *
 * @description
 * 用于为角色分配路由的数据传输对象，包含域、角色 ID 和路由 ID 列表。
 * 路由是前端菜单项，分配后该角色的用户可以看到对应的菜单。
 */
export class AssignRouteDto {
  /**
   * 域
   *
   * @description 路由所属的域代码，用于多租户隔离
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'domain must be a string.' })
  @IsNotEmpty({ message: 'domain cannot be empty.' })
  domain: string;

  /**
   * 角色 ID
   *
   * @description 要分配路由的角色的唯一标识符
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'Role ID must be a string.' })
  @IsNotEmpty({ message: 'Role ID cannot be empty.' })
  roleId: string;

  /**
   * 路由 ID 列表
   *
   * @description 要分配给角色的路由 ID 数组，每个路由 ID 必须为整数
   */
  @ApiProperty({
    type: Number,
    isArray: true,
    required: true,
    description: 'A list of route IDs that will be assigned to the role.',
  })
  @IsArray({ message: 'Routes must be an array of route IDs.' })
  @ArrayNotEmpty({ message: 'Routes array cannot be empty.' })
  @IsInt({ each: true, message: 'Each route ID must be a number.' })
  @IsNotEmpty({ each: true, message: 'Routes ID cannot be empty.' })
  routeIds: number[];
}

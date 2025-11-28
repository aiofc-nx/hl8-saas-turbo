import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

/**
 * 用户分配数据传输对象
 *
 * @description
 * 用于为角色分配用户的数据传输对象，包含角色 ID 和用户 ID 列表。
 * 用户获得角色后，将拥有该角色的所有权限和路由访问权限。
 */
export class AssignUserDto {
  /**
   * 角色 ID
   *
   * @description 要分配用户的角色的唯一标识符
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'Role ID must be a string.' })
  @IsNotEmpty({ message: 'Role ID cannot be empty.' })
  roleId: string;

  /**
   * 用户 ID 列表
   *
   * @description 要分配给角色的用户 ID 数组，每个用户 ID 必须为字符串
   */
  @ApiProperty({
    type: String,
    isArray: true,
    required: true,
    description: 'A list of user IDs that will be assigned to the role.',
  })
  @IsArray({ message: 'Users must be an array of user IDs.' })
  @ArrayNotEmpty({ message: 'Users array cannot be empty.' })
  @IsString({ each: true, message: 'Each user ID must be a string.' })
  @IsNotEmpty({ each: true, message: 'Users ID cannot be empty.' })
  userIds: string[];
}

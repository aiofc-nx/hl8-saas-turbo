import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

/**
 * 权限分配数据传输对象
 *
 * @description
 * 用于为角色分配权限的数据传输对象，包含域、角色 ID 和权限列表。
 * 权限格式通常为 "资源:操作"，例如 "user:read"、"user:write"。
 */
export class AssignPermissionDto {
  /**
   * 域
   *
   * @description 权限所属的域代码，用于多租户隔离
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'domain must be a string.' })
  @IsNotEmpty({ message: 'domain cannot be empty.' })
  domain: string;

  /**
   * 角色 ID
   *
   * @description 要分配权限的角色的唯一标识符
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'Role ID must be a string.' })
  @IsNotEmpty({ message: 'Role ID cannot be empty.' })
  roleId: string;

  /**
   * 权限列表
   *
   * @description 要分配给角色的权限列表，权限格式为 "资源:操作"，例如 ["user:read", "user:write"]
   */
  @ApiProperty({
    type: String,
    isArray: true,
    required: true,
    description: 'A list of permission IDs that will be assigned to the role.',
  })
  @IsArray({ message: 'Permissions must be an array of permission IDs.' })
  @ArrayNotEmpty({ message: 'Permissions array cannot be empty.' })
  @IsString({ each: true, message: 'Each permission ID must be a string.' })
  @IsNotEmpty({ each: true, message: 'Permission ID cannot be empty.' })
  permissions: string[];
}

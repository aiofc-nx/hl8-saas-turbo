import { MenuType, Status } from '@/lib/shared/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@hl8/rest';

/**
 * 菜单分页查询数据传输对象
 *
 * @description
 * 用于分页查询菜单列表的数据传输对象，继承自 PaginationParams，支持按菜单名称、路由名称、菜单类型和状态筛选。
 */
export class PageMenusDto extends PaginationParams {
  /**
   * 菜单名称
   *
   * @description 用于按菜单名称模糊查询菜单，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'menuName must be a string' })
  @IsNotEmpty({ message: 'menuName cannot be empty' })
  menuName?: string;

  /**
   * 路由名称
   *
   * @description 用于按路由名称模糊查询菜单，可选
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'routeName must be a string' })
  @IsNotEmpty({ message: 'routeName cannot be empty' })
  routeName?: string;

  /**
   * 菜单类型
   *
   * @description 用于按菜单类型筛选菜单，可选值：MENU（菜单）、DIRECTORY（目录）、BUTTON（按钮），可选
   */
  @ApiProperty({
    required: false,
    enum: ['MENU', 'DIRECTORY', 'BUTTON'],
    type: 'string',
    example: 'MENU',
  })
  @IsOptional()
  @IsEnum(MenuType, { message: 'menuType must be a valid enum value' })
  menuType?: MenuType;

  /**
   * 状态
   *
   * @description 用于按状态筛选菜单，可选值：ENABLED（启用）、DISABLED（禁用），可选
   */
  @ApiProperty({
    required: false,
    enum: ['ENABLED', 'DISABLED'],
    type: 'string',
    example: 'ENABLED',
  })
  @IsOptional()
  @IsEnum(Status, { message: 'status must be a valid enum value' })
  status?: Status;
}

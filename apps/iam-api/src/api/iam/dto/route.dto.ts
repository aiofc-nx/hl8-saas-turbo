import { MenuType, Status } from '@/lib/shared/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';

/**
 * 路由创建数据传输对象
 *
 * @description
 * 用于创建新路由的数据传输对象，包含菜单名称、路由路径、组件、图标等完整的路由配置信息。
 * 路由用于前端菜单渲染和权限控制，支持树形结构。
 */
export class RouteCreateDto {
  /**
   * 菜单名称
   *
   * @description 菜单的显示名称，用于前端菜单展示
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'menuName must be a string' })
  @IsNotEmpty({ message: 'menuName cannot be empty' })
  menuName: string;

  /**
   * 菜单类型
   *
   * @description 菜单的类型，用于区分不同类型的菜单项
   */
  @ApiProperty({
    required: true,
    enum: Object.values(MenuType),
    type: String,
  })
  @IsNotEmpty({ message: 'menuType cannot be empty' })
  menuType: MenuType;

  /**
   * 图标类型
   *
   * @description 图标的类型，可选
   */
  @ApiProperty({ required: false, type: 'number', nullable: true })
  @ValidateIf((o) => o.iconType !== null)
  @IsNumber({}, { message: 'iconType must be a number' })
  iconType: number | null;

  /**
   * 图标
   *
   * @description 菜单项的图标标识或 URL，可选
   */
  @ApiProperty({ required: false, nullable: true, type: 'string' })
  @ValidateIf((o) => o.icon !== null)
  @IsString({ message: 'icon must be a string' })
  icon: string | null;

  /**
   * 路由名称
   *
   * @description 路由的唯一名称，用于前端路由匹配
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'routeName must be a string' })
  @IsNotEmpty({ message: 'routeName cannot be empty' })
  routeName: string;

  /**
   * 路由路径
   *
   * @description 路由的 URL 路径，例如 "/user" 或 "/user/:id"
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'routePath must be a string' })
  @IsNotEmpty({ message: 'routePath cannot be empty' })
  routePath: string;

  /**
   * 组件
   *
   * @description 前端组件的路径或名称，用于路由渲染
   */
  @ApiProperty({ required: true })
  @IsString({ message: 'component must be a string' })
  @IsNotEmpty({ message: 'component cannot be empty' })
  component: string;

  /**
   * 路径参数
   *
   * @description 路由路径中的动态参数，例如 ":id"，可选
   */
  @ApiProperty({ required: false, nullable: true, type: 'string' })
  @ValidateIf((o) => o.pathParam !== undefined)
  @IsString({ message: 'pathParam must be a string' })
  pathParam?: string | null;

  /**
   * 状态
   *
   * @description 路由的状态，可选值：ACTIVE（激活）、INACTIVE（禁用）
   */
  @ApiProperty({
    required: true,
    enum: Object.values(Status),
    type: String,
  })
  @IsNotEmpty({ message: 'status cannot be empty' })
  status: Status;

  /**
   * 激活菜单
   *
   * @description 当前路由激活时高亮的菜单项路径，可选
   */
  @ApiProperty({ required: false, nullable: true, type: 'string' })
  @ValidateIf((o) => o.activeMenu !== null)
  @IsString({ message: 'activeMenu must be a string' })
  activeMenu: string | null;

  /**
   * 是否在菜单中隐藏
   *
   * @description 是否在菜单中隐藏该路由，true 表示隐藏，可选
   */
  @ApiProperty({ required: false, nullable: true, type: 'boolean' })
  @ValidateIf((o) => o.hideInMenu !== null)
  @IsBoolean({ message: 'hideInMenu must be a boolean' })
  hideInMenu: boolean | null;

  /**
   * 父路由 ID
   *
   * @description 父路由的唯一标识符，用于构建路由树形结构，根路由通常为 0
   */
  @ApiProperty({ required: true })
  @IsInt({ message: 'pid must be a integer' })
  @IsNotEmpty({ message: 'pid cannot be empty' })
  pid: number;

  /**
   * 排序
   *
   * @description 路由在菜单中的显示顺序，数字越小越靠前
   */
  @ApiProperty({ required: true })
  @IsInt({ message: 'order must be an integer' })
  @IsNotEmpty({ message: 'order cannot be empty' })
  order: number;

  /**
   * 国际化键
   *
   * @description 用于国际化的键名，可选
   */
  @ApiProperty({ required: false, nullable: true, type: 'string' })
  @ValidateIf((o) => o.i18nKey !== null)
  @IsString({ message: 'i18nKey must be a string' })
  i18nKey: string | null;

  /**
   * 是否保持活跃
   *
   * @description 是否在路由切换时保持组件状态（keep-alive），可选
   */
  @ApiProperty({ required: false, nullable: true, type: 'boolean' })
  @ValidateIf((o) => o.keepAlive !== null)
  @IsBoolean({ message: 'keepAlive must be a boolean' })
  keepAlive: boolean | null;

  /**
   * 是否常量路由
   *
   * @description 是否为常量路由，常量路由不受权限控制，所有用户都可以访问
   */
  @ApiProperty({ required: true })
  @IsBoolean({ message: 'constant must be a boolean' })
  @IsNotEmpty({ message: 'constant cannot be empty' })
  constant: boolean;

  /**
   * 外部链接
   *
   * @description 如果是外部链接，此字段存储完整的 URL，可选
   */
  @ApiProperty({ required: false, nullable: true, type: 'string' })
  @ValidateIf((o) => o.href !== null)
  @IsString({ message: 'href must be a string' })
  href: string | null;

  /**
   * 是否支持多标签
   *
   * @description 是否在标签页中打开，支持多标签页显示，可选
   */
  @ApiProperty({ required: false, nullable: true, type: 'boolean' })
  @ValidateIf((o) => o.multiTab !== null)
  @IsBoolean({ message: 'multiTab must be a boolean' })
  multiTab: boolean | null;
}

/**
 * 路由更新数据传输对象
 *
 * @description
 * 用于更新现有路由的数据传输对象，继承自 RouteCreateDto，并添加了路由 ID 字段。
 */
export class RouteUpdateDto extends RouteCreateDto {
  /**
   * 路由 ID
   *
   * @description 要更新的路由的唯一标识符
   */
  @ApiProperty({ required: true })
  @IsInt({ message: 'id must be an integer' })
  @IsNotEmpty({ message: 'id cannot be empty' })
  id: number;
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { MenuRoute } from '@/lib/bounded-contexts/iam/menu/application/dto/route.dto';
import { MenuService } from '@/lib/bounded-contexts/iam/menu/application/service/menu.service';
import { MenuCreateCommand } from '@/lib/bounded-contexts/iam/menu/commands/menu-create.command';
import { MenuDeleteCommand } from '@/lib/bounded-contexts/iam/menu/commands/menu-delete.command';
import { MenuUpdateCommand } from '@/lib/bounded-contexts/iam/menu/commands/menu-update.command';
import {
  MenuProperties,
  MenuReadModel,
  type MenuTreeProperties,
} from '@/lib/bounded-contexts/iam/menu/domain/menu.read.model';
import { MenuIdsByRoleIdAndDomainQuery } from '@/lib/bounded-contexts/iam/menu/queries/menu-ids.by-role_id&domain.query';
import { MenusQuery } from '@/lib/bounded-contexts/iam/menu/queries/menus.query';
import { MenusTreeQuery } from '@/lib/bounded-contexts/iam/menu/queries/menus.tree.query';
import { PageMenusQuery } from '@/lib/bounded-contexts/iam/menu/queries/page-menus.query';

import { ApiResponseDoc, Public } from '@hl8/decorators';
import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { PageMenusDto } from '../dto/page-menus.dto';
import { RouteCreateDto, RouteUpdateDto } from '../dto/route.dto';

/**
 * 菜单/路由控制器
 *
 * @description
 * 提供菜单路由管理的 REST API 接口，支持路由的创建、更新、删除和查询。
 * 路由用于前端菜单渲染和权限控制，支持树形结构和常量路由。
 *
 * @example
 * ```typescript
 * // 获取所有路由
 * GET /route
 *
 * // 创建路由
 * POST /route
 * {
 *   "menuName": "用户管理",
 *   "routePath": "/user",
 *   "component": "UserManagement"
 * }
 * ```
 */
@ApiTags('Menu - Module')
@Controller('route')
export class MenuController {
  /**
   * 构造函数
   *
   * @param queryBus - CQRS 查询总线，用于执行查询操作
   * @param commandBus - CQRS 命令总线，用于执行命令操作
   * @param menuService - 菜单服务，用于处理菜单相关的业务逻辑
   */
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly menuService: MenuService,
  ) {}

  /**
   * 获取常量路由
   *
   * @description
   * 获取系统中所有常量路由。常量路由是系统预定义的路由，不受权限控制，所有用户都可以访问。
   *
   * @returns 返回常量路由列表
   *
   * @example
   * ```typescript
   * GET /route/getConstantRoutes
   * ```
   */
  @Public()
  @Get('getConstantRoutes')
  @ApiOperation({
    summary: 'Get constant routes',
    description: 'Retrieve all constant routes available in the system.',
  })
  async getConstantRoutes(): Promise<ApiRes<MenuRoute[]>> {
    const result = await this.menuService.getConstantRoutes();
    return ApiRes.success(result);
  }

  /**
   * 分页查询菜单列表
   *
   * @description
   * 根据查询条件分页获取菜单列表，支持按菜单名称、路由名称、菜单类型和状态筛选。
   *
   * @param queryDto - 分页查询参数，包含页码、页大小、菜单名称、路由名称、菜单类型、状态等筛选条件
   * @returns 返回分页结果，包含菜单列表和分页信息
   *
   * @example
   * ```typescript
   * GET /route?current=1&size=10&menuName=用户&routeName=user&menuType=MENU&status=ENABLED
   * ```
   */
  @Get()
  @ApiOperation({
    summary: 'Retrieve Paginated Menus',
  })
  @ApiResponseDoc({ type: MenuReadModel, isPaged: true })
  async page(
    @Query() queryDto: PageMenusDto,
  ): Promise<ApiRes<PaginationResult<MenuProperties>>> {
    const query = new PageMenusQuery({
      current: queryDto.current,
      size: queryDto.size,
      menuName: queryDto.menuName,
      routeName: queryDto.routeName,
      menuType: queryDto.menuType,
      status: queryDto.status,
    });
    const result = await this.queryBus.execute<
      PageMenusQuery,
      PaginationResult<MenuProperties>
    >(query);
    return ApiRes.success(result);
  }

  /**
   * 获取所有路由列表
   *
   * @description
   * 获取系统中所有路由的列表，返回扁平化的路由数组。
   *
   * @returns 返回路由列表
   *
   * @example
   * ```typescript
   * GET /route/all
   * ```
   */
  @Get('all')
  @ApiOperation({
    summary: 'Get All Routes',
  })
  async routes() {
    const result = await this.queryBus.execute<
      MenusQuery,
      MenuTreeProperties[]
    >(new MenusQuery());
    return ApiRes.success(result);
  }

  /**
   * 获取路由树
   *
   * @description
   * 获取系统中所有路由的树形结构，用于前端菜单渲染。路由按照父子关系组织成树形结构。
   *
   * @returns 返回路由树结构
   *
   * @example
   * ```typescript
   * GET /route/tree
   * ```
   */
  @Get('tree')
  @ApiOperation({
    summary: 'Routes',
  })
  async treeRoute() {
    const result = await this.queryBus.execute<
      MenusTreeQuery,
      MenuTreeProperties[]
    >(new MenusTreeQuery());
    return ApiRes.success(result);
  }

  /**
   * 创建路由
   *
   * @description
   * 创建一个新的菜单路由。路由可以配置菜单名称、路由路径、组件、图标、显示状态等信息。
   * 支持设置父路由，实现路由的层级结构。
   *
   * @param dto - 路由创建数据传输对象，包含菜单名称、路由路径、组件、图标等配置信息
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当路由路径已存在或参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * POST /route
   * {
   *   "menuName": "用户管理",
   *   "routePath": "/user",
   *   "component": "UserManagement",
   *   "icon": "user",
   *   "pid": null,
   *   "order": 1
   * }
   * ```
   */
  @Post()
  @ApiOperation({ summary: 'Create a New Route' })
  @ApiResponse({
    status: 201,
    description: 'The route has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createRoute(
    @Body() dto: RouteCreateDto,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new MenuCreateCommand(
        dto.menuName,
        dto.menuType,
        dto.iconType,
        dto.icon,
        dto.routeName,
        dto.routePath,
        dto.component,
        dto.pathParam ?? null,
        dto.status,
        dto.activeMenu,
        dto.hideInMenu,
        dto.pid,
        dto.order,
        dto.i18nKey,
        dto.keepAlive,
        dto.constant,
        dto.href,
        dto.multiTab,
        req.user.uid,
      ),
    );
    return ApiRes.ok();
  }

  /**
   * 更新路由
   *
   * @description
   * 更新指定路由的信息，包括菜单名称、路由路径、组件、图标、显示状态等配置。
   *
   * @param dto - 路由更新数据传输对象，包含路由 ID 和要更新的字段
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当路由不存在或参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * PUT /route
   * {
   *   "id": 1,
   *   "menuName": "更新后的菜单名称",
   *   "routePath": "/user",
   *   "component": "UserManagement"
   * }
   * ```
   */
  @Put()
  @ApiOperation({ summary: 'Update a Route' })
  @ApiResponse({
    status: 201,
    description: 'The route has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateRoute(
    @Body() dto: RouteUpdateDto,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new MenuUpdateCommand(
        dto.id,
        dto.menuName,
        dto.menuType,
        dto.iconType,
        dto.icon,
        dto.routeName,
        dto.routePath,
        dto.component,
        dto.pathParam ?? null,
        dto.status,
        dto.activeMenu,
        dto.hideInMenu,
        dto.pid,
        dto.order,
        dto.i18nKey,
        dto.keepAlive,
        dto.constant,
        dto.href,
        dto.multiTab,
        req.user.uid,
      ),
    );
    return ApiRes.ok();
  }

  /**
   * 删除路由
   *
   * @description
   * 删除指定的路由。删除前需要确保路由下没有子路由，否则可能抛出异常。
   *
   * @param id - 要删除的路由 ID
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当路由不存在或路由下有关联资源时抛出异常
   *
   * @example
   * ```typescript
   * DELETE /route/1
   * ```
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Route' })
  @ApiResponse({
    status: 201,
    description: 'The route has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteRoute(@Param('id') id: number): Promise<ApiRes<null>> {
    await this.commandBus.execute(new MenuDeleteCommand(id));
    return ApiRes.ok();
  }

  /**
   * 获取角色的授权路由
   *
   * @description
   * 获取指定角色在指定域下已授权的路由 ID 列表。用于前端展示该角色可访问的路由。
   *
   * @param roleId - 角色 ID
   * @param req - HTTP 请求对象，用于获取当前用户的域信息
   * @returns 返回路由 ID 数组
   *
   * @example
   * ```typescript
   * GET /route/auth-route/role-id-123
   * ```
   */
  @Get('auth-route/:roleId')
  @ApiOperation({
    summary: 'Authorized Routes',
  })
  async authRoute(
    @Param('roleId') roleId: string,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ) {
    const result = await this.queryBus.execute<
      MenuIdsByRoleIdAndDomainQuery,
      number[]
    >(new MenuIdsByRoleIdAndDomainQuery(roleId, req.user.domain));
    return ApiRes.success(result);
  }
}

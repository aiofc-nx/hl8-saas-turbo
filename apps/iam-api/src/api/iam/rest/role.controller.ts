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

import { RoleCreateCommand } from '@/lib/bounded-contexts/iam/role/commands/role-create.command';
import { RoleDeleteCommand } from '@/lib/bounded-contexts/iam/role/commands/role-delete.command';
import { RoleUpdateCommand } from '@/lib/bounded-contexts/iam/role/commands/role-update.command';
import {
  RoleProperties,
  RoleReadModel,
} from '@/lib/bounded-contexts/iam/role/domain/role.read.model';
import { PageRolesQuery } from '@/lib/bounded-contexts/iam/role/queries/page-roles.query';

import { ApiResponseDoc } from '@hl8/decorators';
import { ApiRes, PaginationResult } from '@hl8/rest';

import { PageRolesDto } from '../dto/page-roles.dto';
import { RoleCreateDto, RoleUpdateDto } from '../dto/role.dto';

/**
 * 角色控制器
 *
 * @description
 * 提供角色管理的 REST API 接口，支持角色的创建、更新、删除和分页查询。
 * 角色是权限管理的基础，通过角色可以组织和管理用户权限。
 *
 * @example
 * ```typescript
 * // 分页查询角色
 * GET /role?current=1&size=10&code=admin&status=ACTIVE
 *
 * // 创建角色
 * POST /role
 * {
 *   "code": "admin",
 *   "name": "管理员",
 *   "description": "系统管理员角色"
 * }
 * ```
 */
@ApiTags('Role - Module')
@Controller('role')
export class RoleController {
  /**
   * 构造函数
   *
   * @param queryBus - CQRS 查询总线，用于执行查询操作
   * @param commandBus - CQRS 命令总线，用于执行命令操作
   */
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * 分页查询角色列表
   *
   * @description
   * 根据查询条件分页获取角色列表，支持按角色代码、名称和状态筛选。
   *
   * @param queryDto - 分页查询参数，包含页码、页大小、角色代码、名称、状态等筛选条件
   * @returns 返回分页结果，包含角色列表和分页信息
   *
   * @example
   * ```typescript
   * GET /role?current=1&size=10&code=admin&name=管理员&status=ACTIVE
   * ```
   */
  @Get()
  @ApiOperation({
    summary: 'Retrieve Paginated Roles',
  })
  @ApiResponseDoc({ type: RoleReadModel, isPaged: true })
  async page(
    @Query() queryDto: PageRolesDto,
  ): Promise<ApiRes<PaginationResult<RoleProperties>>> {
    const query = new PageRolesQuery({
      current: queryDto.current,
      size: queryDto.size,
      code: queryDto.code,
      name: queryDto.name,
      status: queryDto.status,
    });
    const result = await this.queryBus.execute<
      PageRolesQuery,
      PaginationResult<RoleProperties>
    >(query);
    return ApiRes.success(result);
  }

  /**
   * 创建角色
   *
   * @description
   * 创建一个新角色。角色代码必须唯一，用于标识不同的角色。支持设置父角色，实现角色层级结构。
   *
   * @param dto - 角色创建数据传输对象，包含角色代码、名称、父角色 ID、状态、描述等信息
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当角色代码已存在或参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * POST /role
   * {
   *   "code": "admin",
   *   "name": "管理员",
   *   "pid": null,
   *   "status": "ACTIVE",
   *   "description": "系统管理员角色"
   * }
   * ```
   */
  @Post()
  @ApiOperation({ summary: 'Create a New Role' })
  @ApiResponse({
    status: 201,
    description: 'The role has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createRole(
    @Body() dto: RoleCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new RoleCreateCommand(
        dto.code,
        dto.name,
        dto.pid,
        dto.status,
        dto.description,
        req.user.uid,
      ),
    );
    return ApiRes.ok();
  }

  /**
   * 更新角色
   *
   * @description
   * 更新指定角色的信息，包括名称、父角色、状态、描述等。角色代码通常不允许修改。
   *
   * @param dto - 角色更新数据传输对象，包含角色 ID 和要更新的字段
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当角色不存在或参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * PUT /role
   * {
   *   "id": "role-id-123",
   *   "code": "admin",
   *   "name": "更新后的角色名称",
   *   "status": "ACTIVE",
   *   "description": "更新后的描述"
   * }
   * ```
   */
  @Put()
  @ApiOperation({ summary: 'Update a Role' })
  @ApiResponse({
    status: 201,
    description: 'The role has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateRole(
    @Body() dto: RoleUpdateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new RoleUpdateCommand(
        dto.id,
        dto.code,
        dto.name,
        dto.pid,
        dto.status,
        dto.description,
        req.user.uid,
      ),
    );
    return ApiRes.ok();
  }

  /**
   * 删除角色
   *
   * @description
   * 删除指定的角色。删除前需要确保角色下没有关联的用户或权限，否则可能抛出异常。
   *
   * @param id - 要删除的角色 ID
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当角色不存在或角色下有关联资源时抛出异常
   *
   * @example
   * ```typescript
   * DELETE /role/role-id-123
   * ```
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Role' })
  @ApiResponse({
    status: 201,
    description: 'The role has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteRole(@Param('id') id: string): Promise<ApiRes<null>> {
    await this.commandBus.execute(new RoleDeleteCommand(id));
    return ApiRes.ok();
  }
}

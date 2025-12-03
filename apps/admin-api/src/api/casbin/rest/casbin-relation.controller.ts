import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthZGuard, UsePermissions } from '@hl8/casbin';
import { ApiResponseDoc } from '@hl8/decorators';
import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { RelationCreateCommand } from '@/lib/bounded-contexts/casbin/commands/relation-create.command';
import { RelationDeleteCommand } from '@/lib/bounded-contexts/casbin/commands/relation-delete.command';
import {
  RoleRelationDto,
  RoleRelationProperties,
  casbinRuleToRoleRelationDto,
} from '@/lib/bounded-contexts/casbin/domain/policy-rule.model';
import { PageRelationsQuery } from '@/lib/bounded-contexts/casbin/queries/page-relations.query';

import { PageRelationsDto } from '../dto/page-relations.dto';
import { RoleRelationCreateDto } from '../dto/role-relation.dto';

/**
 * Casbin 角色继承关系控制器
 *
 * @description
 * 提供角色继承关系管理的 REST API 接口，支持角色继承关系的创建、删除和查询。
 * 所有接口都需要通过权限验证，使用 Casbin 进行权限控制。
 *
 * @example
 * ```typescript
 * // 获取角色继承关系列表
 * GET /casbin/relations
 *
 * // 创建角色继承关系
 * POST /casbin/relations
 * {
 *   "childSubject": "user-123",
 *   "parentRole": "admin"
 * }
 * ```
 */
@UseGuards(AuthZGuard)
@ApiTags('Casbin - Relation')
@Controller('casbin/relations')
export class CasbinRelationController {
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
   * 分页查询角色继承关系列表
   *
   * @description
   * 根据查询条件分页获取角色继承关系列表，支持按子主体、父角色、域等筛选。
   *
   * @param queryDto - 分页查询参数，包含页码、页大小、子主体、父角色、域等筛选条件
   * @returns 返回分页结果，包含角色继承关系列表和分页信息
   *
   * @example
   * ```typescript
   * GET /casbin/relations?current=1&size=10&childSubject=user-123
   * ```
   */
  @Get()
  @UsePermissions({ resource: 'casbin:relation', action: 'read' })
  @ApiOperation({
    summary: 'Retrieve Paginated Role Relations',
  })
  @ApiResponseDoc({ type: RoleRelationDto, isPaged: true })
  async page(
    @Query() queryDto: PageRelationsDto,
  ): Promise<ApiRes<PaginationResult<RoleRelationDto>>> {
    const query = new PageRelationsQuery({
      current: queryDto.current,
      size: queryDto.size,
      childSubject: queryDto.childSubject,
      parentRole: queryDto.parentRole,
      domain: queryDto.domain,
    });

    const result = await this.queryBus.execute<
      PageRelationsQuery,
      PaginationResult<RoleRelationProperties>
    >(query);

    // 转换为 DTO
    const dtoResult = new PaginationResult<RoleRelationDto>(
      result.current,
      result.size,
      result.total,
      result.records.map((relation) =>
        casbinRuleToRoleRelationDto({
          id: relation.id,
          v0: relation.v0,
          v1: relation.v1,
          v2: relation.v2,
        }),
      ),
    );

    return ApiRes.success(dtoResult);
  }

  /**
   * 创建角色继承关系
   *
   * @description
   * 创建一个新的角色继承关系。角色继承关系用于定义用户与角色的绑定，或角色之间的继承关系。
   *
   * @param dto - 角色继承关系创建数据传输对象，包含子主体、父角色、域等信息
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * POST /casbin/relations
   * {
   *   "childSubject": "user-123",
   *   "parentRole": "admin",
   *   "domain": "example.com"
   * }
   * ```
   */
  @Post()
  @UsePermissions({ resource: 'casbin:relation', action: 'create' })
  @ApiOperation({ summary: 'Create a New Role Relation' })
  @ApiResponse({
    status: 201,
    description: 'The role relation has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createRelation(
    @Body() dto: RoleRelationCreateDto,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    const relationDto: RoleRelationDto = {
      id: 0, // 创建时不需要 ID
      ...dto,
    };

    await this.commandBus.execute(
      new RelationCreateCommand(relationDto, req.user.uid),
    );
    return ApiRes.ok();
  }

  /**
   * 删除角色继承关系
   *
   * @description
   * 删除指定的角色继承关系。
   *
   * @param id - 要删除的角色继承关系 ID
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当角色继承关系不存在时抛出异常
   *
   * @example
   * ```typescript
   * DELETE /casbin/relations/1
   * ```
   */
  @Delete(':id')
  @UsePermissions({ resource: 'casbin:relation', action: 'delete' })
  @ApiOperation({ summary: 'Delete a Role Relation' })
  @ApiResponse({
    status: 201,
    description: 'The role relation has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteRelation(
    @Param('id') id: number,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(new RelationDeleteCommand(id, req.user.uid));
    return ApiRes.ok();
  }
}

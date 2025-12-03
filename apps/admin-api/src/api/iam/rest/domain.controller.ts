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

import { DomainCreateCommand } from '@/lib/bounded-contexts/iam/domain/commands/domain-create.command';
import { DomainDeleteCommand } from '@/lib/bounded-contexts/iam/domain/commands/domain-delete.command';
import { DomainUpdateCommand } from '@/lib/bounded-contexts/iam/domain/commands/domain-update.command';
import {
  DomainProperties,
  DomainReadModel,
} from '@/lib/bounded-contexts/iam/domain/domain/domain.read.model';
import { PageDomainsQuery } from '@/lib/bounded-contexts/iam/domain/queries/page-domains.query';

import { ApiResponseDoc } from '@hl8/decorators';
import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { DomainCreateDto, DomainUpdateDto } from '../dto/domain.dto';
import { PageDomainsDto } from '../dto/page-domains.dto';

/**
 * 域控制器
 *
 * @description
 * 提供 Casbin 域（Domain）的 REST API 接口，支持域的创建、更新、删除和分页查询。
 * 域是 Casbin 权限模型中的多租户隔离单位，用于实现不同租户之间的权限隔离。
 *
 * @example
 * ```typescript
 * // 分页查询域
 * GET /domain?current=1&size=10&name=test&status=ACTIVE
 *
 * // 创建域
 * POST /domain
 * {
 *   "code": "domain001",
 *   "name": "测试域",
 *   "description": "这是一个测试域"
 * }
 * ```
 */
@ApiTags('Casbin Domain - Module')
@Controller('domain')
export class DomainController {
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
   * 分页查询域列表
   *
   * @description
   * 根据查询条件分页获取域列表，支持按名称和状态筛选。
   *
   * @param queryDto - 分页查询参数，包含页码、页大小、名称、状态等筛选条件
   * @returns 返回分页结果，包含域列表和分页信息
   *
   * @example
   * ```typescript
   * GET /domain?current=1&size=10&name=test&status=ACTIVE
   * ```
   */
  @Get()
  @ApiOperation({
    summary: 'Retrieve Paginated Casbin Domains',
  })
  @ApiResponseDoc({ type: DomainReadModel, isPaged: true })
  async page(
    @Query() queryDto: PageDomainsDto,
  ): Promise<ApiRes<PaginationResult<DomainProperties>>> {
    const query = new PageDomainsQuery({
      current: queryDto.current,
      size: queryDto.size,
      name: queryDto.name,
      status: queryDto.status,
    });
    const result = await this.queryBus.execute<
      PageDomainsQuery,
      PaginationResult<DomainProperties>
    >(query);
    return ApiRes.success(result);
  }

  /**
   * 创建域
   *
   * @description
   * 创建一个新的 Casbin 域。域代码必须唯一，用于标识不同的租户或业务域。
   *
   * @param dto - 域创建数据传输对象，包含域代码、名称、描述等信息
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当域代码已存在或参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * POST /domain
   * {
   *   "code": "domain001",
   *   "name": "测试域",
   *   "description": "这是一个测试域"
   * }
   * ```
   */
  @Post()
  @ApiOperation({ summary: 'Create a New Domain' })
  @ApiResponse({
    status: 201,
    description: 'The domain has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createDomain(
    @Body() dto: DomainCreateDto,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new DomainCreateCommand(
        dto.code,
        dto.name,
        dto.description,
        req.user.uid,
      ),
    );
    return ApiRes.ok();
  }

  /**
   * 更新域
   *
   * @description
   * 更新指定域的信息，包括名称、描述等。域代码通常不允许修改。
   *
   * @param dto - 域更新数据传输对象，包含域 ID 和要更新的字段
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当域不存在或参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * PUT /domain
   * {
   *   "id": "domain-id-123",
   *   "code": "domain001",
   *   "name": "更新后的域名称",
   *   "description": "更新后的描述"
   * }
   * ```
   */
  @Put()
  @ApiOperation({ summary: 'Update a Domain' })
  @ApiResponse({
    status: 201,
    description: 'The domain has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateDomain(
    @Body() dto: DomainUpdateDto,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new DomainUpdateCommand(
        dto.id,
        dto.code,
        dto.name,
        dto.description,
        req.user.uid,
      ),
    );
    return ApiRes.ok();
  }

  /**
   * 删除域
   *
   * @description
   * 删除指定的域。删除前需要确保域下没有关联的用户、角色等资源，否则可能抛出异常。
   *
   * @param id - 要删除的域 ID
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当域不存在或域下有关联资源时抛出异常
   *
   * @example
   * ```typescript
   * DELETE /domain/domain-id-123
   * ```
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Domain' })
  @ApiResponse({
    status: 201,
    description: 'The domain has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteDomain(@Param('id') id: string): Promise<ApiRes<null>> {
    await this.commandBus.execute(new DomainDeleteCommand(id));
    return ApiRes.ok();
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessKeyCreateCommand } from '@/lib/bounded-contexts/access-key/commands/access_key-create.command';
import { AccessKeyDeleteCommand } from '@/lib/bounded-contexts/access-key/commands/access_key-delete.command';
import {
  AccessKeyProperties,
  AccessKeyReadModel,
} from '@/lib/bounded-contexts/access-key/domain/access_key.read.model';
import { PageAccessKeysQuery } from '@/lib/bounded-contexts/access-key/queries/page-access_key.query';

import { BUILT_IN } from '@/lib/shared/constants/db.constant';
import { ApiResponseDoc } from '@hl8/decorators';
import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { AccessKeyCreateDto } from '../dto/access_key.dto';
import { PageAccessKeysQueryDto } from '../dto/page-access_key.dto';

/**
 * 访问密钥控制器
 *
 * @description
 * 提供访问密钥（AccessKey）管理的 REST API 接口，支持访问密钥的创建、删除和分页查询。
 * 访问密钥用于 API 调用认证，支持多租户场景下的密钥管理。
 *
 * @example
 * ```typescript
 * // 分页查询访问密钥
 * GET /access-key?current=1&size=10&domain=domain001&status=ACTIVE
 *
 * // 创建访问密钥
 * POST /access-key
 * {
 *   "domain": "domain001",
 *   "description": "用于第三方系统集成"
 * }
 * ```
 */
@ApiTags('AccessKey - Module')
@Controller('access-key')
export class AccessKeyController {
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
   * 分页查询访问密钥列表
   *
   * @description
   * 根据查询条件分页获取访问密钥列表，支持按域和状态筛选。
   * 非内置域用户只能查询自己域下的访问密钥。
   *
   * @param queryDto - 分页查询参数，包含页码、页大小、域、状态等筛选条件
   * @param req - HTTP 请求对象，用于获取当前用户的域信息
   * @returns 返回分页结果，包含访问密钥列表和分页信息
   *
   * @example
   * ```typescript
   * GET /access-key?current=1&size=10&domain=domain001&status=ACTIVE
   * ```
   */
  @Get()
  @ApiOperation({
    summary: 'Retrieve Paginated AccessKeys',
  })
  @ApiResponseDoc({ type: AccessKeyReadModel, isPaged: true })
  async page(
    @Query() queryDto: PageAccessKeysQueryDto,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<PaginationResult<AccessKeyProperties>>> {
    const query = new PageAccessKeysQuery({
      current: queryDto.current,
      size: queryDto.size,
      domain: req.user.domain === BUILT_IN ? queryDto.domain : req.user.domain,
      status: queryDto.status,
    });
    const result = await this.queryBus.execute<
      PageAccessKeysQuery,
      PaginationResult<AccessKeyProperties>
    >(query);
    return ApiRes.success(result);
  }

  /**
   * 创建访问密钥
   *
   * @description
   * 创建一个新的访问密钥。系统会自动生成密钥 ID 和密钥值，密钥值只在创建时返回一次，需要妥善保存。
   * 非内置域用户只能为自己域创建访问密钥。
   *
   * @param dto - 访问密钥创建数据传输对象，包含域和描述信息
   * @param req - HTTP 请求对象，用于获取当前用户的域信息
   * @returns 返回操作结果，成功时返回 null（实际应返回密钥信息，此处可能需要优化）
   *
   * @throws {HttpException} 当域不存在或参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * POST /access-key
   * {
   *   "domain": "domain001",
   *   "description": "用于第三方系统集成"
   * }
   * ```
   */
  @Post()
  @ApiOperation({ summary: 'Create a New AccessKey' })
  @ApiResponse({
    status: 201,
    description: 'The accessKey has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createAccessKey(
    @Body() dto: AccessKeyCreateDto,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new AccessKeyCreateCommand(
        req.user.domain === BUILT_IN ? (dto.domain ?? '') : req.user.domain,
        dto.description,
        req.user.uid,
      ),
    );
    return ApiRes.ok();
  }

  /**
   * 删除访问密钥
   *
   * @description
   * 删除指定的访问密钥。删除后该密钥将立即失效，使用该密钥的 API 调用将无法通过认证。
   *
   * @param id - 要删除的访问密钥 ID
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当访问密钥不存在时抛出异常
   *
   * @example
   * ```typescript
   * DELETE /access-key/access-key-id-123
   * ```
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a AccessKey' })
  @ApiResponse({
    status: 201,
    description: 'The accessKey has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteAccessKey(@Param('id') id: string): Promise<ApiRes<null>> {
    await this.commandBus.execute(new AccessKeyDeleteCommand(id));
    return ApiRes.ok();
  }
}

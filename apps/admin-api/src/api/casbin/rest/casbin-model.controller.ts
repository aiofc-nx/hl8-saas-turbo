import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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

import { ModelConfigStatus } from '@/infra/entities/casbin-model-config.entity';
import { ModelDraftCreateCommand } from '@/lib/bounded-contexts/casbin/commands/model-draft-create.command';
import { ModelDraftUpdateCommand } from '@/lib/bounded-contexts/casbin/commands/model-draft-update.command';
import { ModelPublishCommand } from '@/lib/bounded-contexts/casbin/commands/model-publish.command';
import { ModelRollbackCommand } from '@/lib/bounded-contexts/casbin/commands/model-rollback.command';
import {
  CasbinModelConfigDto,
  CasbinModelConfigProperties,
  ModelVersionDiffDto,
} from '@/lib/bounded-contexts/casbin/domain/casbin-model.model';
import { ModelVersionDetailQuery } from '@/lib/bounded-contexts/casbin/queries/model-version-detail.query';
import { ModelVersionDiffQuery } from '@/lib/bounded-contexts/casbin/queries/model-version-diff.query';
import { PageModelVersionsQuery } from '@/lib/bounded-contexts/casbin/queries/page-model-versions.query';

import {
  ModelDraftCreateDto,
  ModelDraftUpdateDto,
} from '../dto/model-config.dto';
import { PageModelVersionsDto } from '../dto/page-model-versions.dto';

/**
 * Casbin 模型配置控制器
 *
 * @description
 * 提供模型配置版本管理的 REST API 接口，支持模型配置的创建、更新、发布和回滚。
 * 所有接口都需要通过权限验证，使用 Casbin 进行权限控制。
 * 模型配置变更属于高风险操作，需要严格的权限控制。
 *
 * @example
 * ```typescript
 * // 获取版本列表
 * GET /casbin/model/versions
 *
 * // 创建草稿
 * POST /casbin/model/drafts
 * {
 *   "content": "[request_definition]\nr = sub, obj, act\n...",
 *   "remark": "修复权限匹配逻辑"
 * }
 * ```
 */
@UseGuards(AuthZGuard)
@ApiTags('Casbin - Model')
@Controller('casbin/model')
export class CasbinModelController {
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
   * 分页查询模型配置版本列表
   *
   * @description
   * 根据查询条件分页获取模型配置版本列表，支持按状态筛选。
   *
   * @param queryDto - 分页查询参数
   * @returns 返回分页结果，包含版本列表和分页信息
   */
  @Get('versions')
  @UsePermissions({ resource: 'casbin:model', action: 'read' })
  @ApiOperation({
    summary: 'Retrieve Paginated Model Versions',
  })
  @ApiResponseDoc({ type: CasbinModelConfigDto, isPaged: true })
  async pageVersions(
    @Query() queryDto: PageModelVersionsDto,
  ): Promise<ApiRes<PaginationResult<CasbinModelConfigDto>>> {
    const query = new PageModelVersionsQuery({
      current: queryDto.current,
      size: queryDto.size,
      status: queryDto.status,
    });

    const result = await this.queryBus.execute<
      PageModelVersionsQuery,
      PaginationResult<CasbinModelConfigProperties>
    >(query);

    // 转换为 DTO
    const dtoResult = new PaginationResult<CasbinModelConfigDto>(
      result.current,
      result.size,
      result.total,
      result.records.map((config) => ({
        id: config.id,
        content: config.content,
        version: config.version,
        status: config.status,
        remark: config.remark,
        createdBy: config.createdBy,
        createdAt: config.createdAt,
        approvedBy: config.approvedBy,
        approvedAt: config.approvedAt,
      })),
    );

    return ApiRes.success(dtoResult);
  }

  /**
   * 获取当前激活的模型配置
   *
   * @description
   * 获取当前处于激活状态的模型配置版本。
   *
   * @returns 返回激活版本的模型配置
   */
  @Get('active')
  @UsePermissions({ resource: 'casbin:model', action: 'read' })
  @ApiOperation({
    summary: 'Get Active Model Config',
  })
  @ApiResponseDoc({ type: CasbinModelConfigDto })
  async getActive(): Promise<ApiRes<CasbinModelConfigDto | null>> {
    const query = new PageModelVersionsQuery({
      current: 1,
      size: 1,
      status: ModelConfigStatus.ACTIVE,
    });

    const result = await this.queryBus.execute<
      PageModelVersionsQuery,
      PaginationResult<CasbinModelConfigProperties>
    >(query);

    if (result.records.length === 0) {
      return ApiRes.success(null);
    }

    const config = result.records[0];
    const dto: CasbinModelConfigDto = {
      id: config.id,
      content: config.content,
      version: config.version,
      status: config.status,
      remark: config.remark,
      createdBy: config.createdBy,
      createdAt: config.createdAt,
      approvedBy: config.approvedBy,
      approvedAt: config.approvedAt,
    };

    return ApiRes.success(dto);
  }

  /**
   * 获取版本详情
   *
   * @description
   * 获取指定版本的模型配置详情。
   *
   * @param id - 版本 ID
   * @returns 返回版本详情
   */
  @Get('versions/:id')
  @UsePermissions({ resource: 'casbin:model', action: 'read' })
  @ApiOperation({
    summary: 'Get Model Version Detail',
  })
  @ApiResponseDoc({ type: CasbinModelConfigDto })
  async getVersionDetail(
    @Param('id') id: number,
  ): Promise<ApiRes<CasbinModelConfigDto | null>> {
    const result = await this.queryBus.execute<
      ModelVersionDetailQuery,
      CasbinModelConfigProperties | null
    >(new ModelVersionDetailQuery(id));

    if (!result) {
      return ApiRes.success(null);
    }

    const dto: CasbinModelConfigDto = {
      id: result.id,
      content: result.content,
      version: result.version,
      status: result.status,
      remark: result.remark,
      createdBy: result.createdBy,
      createdAt: result.createdAt,
      approvedBy: result.approvedBy,
      approvedAt: result.approvedAt,
    };

    return ApiRes.success(dto);
  }

  /**
   * 获取版本差异
   *
   * @description
   * 获取两个版本之间的差异内容。
   *
   * @param sourceId - 源版本 ID
   * @param targetId - 目标版本 ID
   * @returns 返回版本差异
   */
  @Get('versions/:sourceId/diff/:targetId')
  @UsePermissions({ resource: 'casbin:model', action: 'read' })
  @ApiOperation({
    summary: 'Get Model Version Diff',
  })
  @ApiResponseDoc({ type: ModelVersionDiffDto })
  async getVersionDiff(
    @Param('sourceId') sourceId: number,
    @Param('targetId') targetId: number,
  ): Promise<ApiRes<ModelVersionDiffDto>> {
    const result = await this.queryBus.execute<
      ModelVersionDiffQuery,
      ModelVersionDiffDto
    >(new ModelVersionDiffQuery(sourceId, targetId));

    return ApiRes.success(result);
  }

  /**
   * 创建模型配置草稿
   *
   * @description
   * 创建新的模型配置草稿版本。会先校验模型配置内容。
   *
   * @param dto - 草稿创建数据传输对象
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果
   */
  @Post('drafts')
  @UsePermissions({ resource: 'casbin:model', action: 'edit' })
  @ApiOperation({ summary: 'Create Model Draft' })
  @ApiResponse({
    status: 201,
    description: 'The model draft has been successfully created.',
  })
  async createDraft(
    @Body() dto: ModelDraftCreateDto,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new ModelDraftCreateCommand(dto.content, dto.remark, req.user.uid),
    );
    return ApiRes.ok();
  }

  /**
   * 更新模型配置草稿
   *
   * @description
   * 更新已存在的模型配置草稿。会先校验模型配置内容。
   *
   * @param id - 草稿版本 ID
   * @param dto - 草稿更新数据传输对象
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果
   */
  @Put('drafts/:id')
  @UsePermissions({ resource: 'casbin:model', action: 'edit' })
  @ApiOperation({ summary: 'Update Model Draft' })
  @ApiResponse({
    status: 201,
    description: 'The model draft has been successfully updated.',
  })
  async updateDraft(
    @Param('id') id: number,
    @Body() dto: ModelDraftUpdateDto,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new ModelDraftUpdateCommand(id, dto.content, dto.remark, req.user.uid),
    );
    return ApiRes.ok();
  }

  /**
   * 发布模型配置版本
   *
   * @description
   * 将指定版本设置为激活状态，并触发 Enforcer 重新加载。
   *
   * @param id - 要发布的版本 ID
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果
   */
  @Post('versions/:id/publish')
  @UsePermissions({ resource: 'casbin:model', action: 'approve' })
  @ApiOperation({ summary: 'Publish Model Version' })
  @ApiResponse({
    status: 201,
    description: 'The model version has been successfully published.',
  })
  async publishVersion(
    @Param('id') id: number,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(new ModelPublishCommand(id, req.user.uid));
    return ApiRes.ok();
  }

  /**
   * 回滚到历史版本
   *
   * @description
   * 将指定的历史版本重新设置为激活状态，并触发 Enforcer 重新加载。
   *
   * @param id - 要回滚到的版本 ID
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果
   */
  @Post('versions/:id/rollback')
  @UsePermissions({ resource: 'casbin:model', action: 'approve' })
  @ApiOperation({ summary: 'Rollback Model Version' })
  @ApiResponse({
    status: 201,
    description: 'The model has been successfully rolled back.',
  })
  async rollbackVersion(
    @Param('id') id: number,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(new ModelRollbackCommand(id, req.user.uid));
    return ApiRes.ok();
  }
}

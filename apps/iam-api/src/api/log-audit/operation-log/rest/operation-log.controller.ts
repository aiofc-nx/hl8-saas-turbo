import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  OperationLogProperties,
  OperationLogReadModel,
} from '@/lib/bounded-contexts/log-audit/operation-log/domain/operation-log.read.model';
import { PageOperationLogsQuery } from '@/lib/bounded-contexts/log-audit/operation-log/queries/page-operation-logs.query';

import { AuthActionVerb, AuthZGuard, UsePermissions } from '@hl8/casbin';
import { ApiResponseDoc } from '@hl8/decorators';
import { ApiRes, PaginationResult } from '@hl8/rest';

import { PageOperationLogsQueryDto } from '../dto/page-operation-log.dto';

/**
 * 操作日志控制器
 *
 * @description
 * 提供操作日志查询的 REST API 接口，支持分页查询和条件筛选。
 * 操作日志记录用户的操作行为，包括操作时间、模块名称、HTTP 方法等信息。
 *
 * @example
 * ```typescript
 * // 分页查询操作日志
 * GET /operation-log?current=1&size=10&username=test&moduleName=user
 * ```
 */
@UseGuards(AuthZGuard)
@ApiTags('Operation Log - Module')
@Controller('operation-log')
export class OperationLogController {
  /**
   * 构造函数
   *
   * @param queryBus - CQRS 查询总线，用于执行查询操作
   */
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * 分页查询操作日志列表
   *
   * @description
   * 根据查询条件分页获取操作日志列表，支持按用户名、域、模块名称、HTTP 方法筛选。
   *
   * @param queryDto - 分页查询参数，包含页码、页大小、用户名、域、模块名称、HTTP 方法等筛选条件
   * @returns 返回分页结果，包含操作日志列表和分页信息
   *
   * @example
   * ```typescript
   * GET /operation-log?current=1&size=10&username=test&domain=domain001&moduleName=user&method=POST
   * ```
   */
  @Get()
  @UsePermissions({ resource: 'operation-log', action: AuthActionVerb.READ })
  @ApiOperation({
    summary: 'Retrieve Paginated Operation Logs',
  })
  @ApiResponseDoc({ type: OperationLogReadModel, isPaged: true })
  async page(
    @Query() queryDto: PageOperationLogsQueryDto,
  ): Promise<ApiRes<PaginationResult<OperationLogProperties>>> {
    const query = new PageOperationLogsQuery({
      current: queryDto.current,
      size: queryDto.size,
      username: queryDto.username,
      domain: queryDto.domain,
      moduleName: queryDto.moduleName,
      method: queryDto.method,
    });
    const result = await this.queryBus.execute<
      PageOperationLogsQuery,
      PaginationResult<OperationLogProperties>
    >(query);

    return ApiRes.success(result);
  }
}

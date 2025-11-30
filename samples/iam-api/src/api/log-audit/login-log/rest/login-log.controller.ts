import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  LoginLogProperties,
  LoginLogReadModel,
} from '@/lib/bounded-contexts/log-audit/login-log/domain/login-log.read.model';
import { PageLoginLogsQuery } from '@/lib/bounded-contexts/log-audit/login-log/queries/page-login-logs.query';

import { AuthActionVerb, AuthZGuard, UsePermissions } from '@hl8/casbin';
import { ApiResponseDoc } from '@hl8/decorators';
import { ApiRes, PaginationResult } from '@hl8/rest';

import { PageLoginLogsQueryDto } from '../dto/page-login-log.dto';

/**
 * 登录日志控制器
 *
 * @description
 * 提供登录日志查询的 REST API 接口，支持分页查询和条件筛选。
 * 登录日志记录用户的登录行为，包括登录时间、IP 地址、地理位置等信息。
 *
 * @example
 * ```typescript
 * // 分页查询登录日志
 * GET /login-log?current=1&size=10&username=test&domain=domain001
 * ```
 */
@UseGuards(AuthZGuard)
@ApiTags('Login Log - Module')
@Controller('login-log')
export class LoginLogController {
  /**
   * 构造函数
   *
   * @param queryBus - CQRS 查询总线，用于执行查询操作
   */
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * 分页查询登录日志列表
   *
   * @description
   * 根据查询条件分页获取登录日志列表，支持按用户名、域、地址、登录类型筛选。
   *
   * @param queryDto - 分页查询参数，包含页码、页大小、用户名、域、地址、类型等筛选条件
   * @returns 返回分页结果，包含登录日志列表和分页信息
   *
   * @example
   * ```typescript
   * GET /login-log?current=1&size=10&username=test&domain=domain001&address=192.168.1.1&type=password
   * ```
   */
  @Get()
  @UsePermissions({ resource: 'login-log', action: AuthActionVerb.READ })
  @ApiOperation({
    summary: 'Retrieve Paginated Login Logs',
  })
  @ApiResponseDoc({ type: LoginLogReadModel, isPaged: true })
  async page(
    @Query() queryDto: PageLoginLogsQueryDto,
  ): Promise<ApiRes<PaginationResult<LoginLogProperties>>> {
    const query = new PageLoginLogsQuery({
      current: queryDto.current,
      size: queryDto.size,
      username: queryDto.username,
      domain: queryDto.domain,
      address: queryDto.address,
      type: queryDto.type,
    });
    const result = await this.queryBus.execute<
      PageLoginLogsQuery,
      PaginationResult<LoginLogProperties>
    >(query);

    return ApiRes.success(result);
  }
}

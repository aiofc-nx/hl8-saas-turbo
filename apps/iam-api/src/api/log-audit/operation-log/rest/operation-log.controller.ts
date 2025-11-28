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

@UseGuards(AuthZGuard)
@ApiTags('Operation Log - Module')
@Controller('operation-log')
export class OperationLogController {
  constructor(private readonly queryBus: QueryBus) {}

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

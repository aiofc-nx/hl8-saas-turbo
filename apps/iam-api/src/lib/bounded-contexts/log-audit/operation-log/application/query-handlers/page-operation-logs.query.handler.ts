import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginationResult } from '@hl8/rest';

import { OperationLogReadRepoPortToken } from '../../constants';
import type { OperationLogProperties } from '../../domain/operation-log.read.model';
import type { OperationLogReadRepoPort } from '../../ports/operation-log.read.repo-port';
import { PageOperationLogsQuery } from '../../queries/page-operation-logs.query';

@QueryHandler(PageOperationLogsQuery)
export class PageOperationLogsQueryHandler
  implements
    IQueryHandler<
      PageOperationLogsQuery,
      PaginationResult<OperationLogProperties>
    >
{
  @Inject(OperationLogReadRepoPortToken)
  private readonly repository: OperationLogReadRepoPort;

  async execute(
    query: PageOperationLogsQuery,
  ): Promise<PaginationResult<OperationLogProperties>> {
    return this.repository.pageOperationLogs(query);
  }
}

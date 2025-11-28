import { PaginationResult } from '@hl8/rest';

import type { OperationLogProperties } from '../domain/operation-log.read.model';
import { PageOperationLogsQuery } from '../queries/page-operation-logs.query';

export interface OperationLogReadRepoPort {
  pageOperationLogs(
    query: PageOperationLogsQuery,
  ): Promise<PaginationResult<OperationLogProperties>>;
}

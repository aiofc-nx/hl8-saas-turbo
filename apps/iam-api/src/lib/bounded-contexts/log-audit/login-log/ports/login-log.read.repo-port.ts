import { PaginationResult } from '@hl8/rest';

import type { LoginLogProperties } from '../domain/login-log.read.model';
import { PageLoginLogsQuery } from '../queries/page-login-logs.query';

export interface LoginLogReadRepoPort {
  pageLoginLogs(
    query: PageLoginLogsQuery,
  ): Promise<PaginationResult<LoginLogProperties>>;
}

import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

export class PageOperationLogsQuery extends PaginationParams implements IQuery {
  readonly username?: string;
  readonly domain?: string;
  readonly moduleName?: string;
  readonly method?: string;
  constructor(options: PageOperationLogsQuery) {
    super();
    Object.assign(this, options);
  }
}

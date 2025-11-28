import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

export class PageLoginLogsQuery extends PaginationParams implements IQuery {
  readonly username?: string;
  readonly domain?: string;
  readonly address?: string;
  readonly type?: string;
  constructor(options: PageLoginLogsQuery) {
    super();
    Object.assign(this, options);
  }
}

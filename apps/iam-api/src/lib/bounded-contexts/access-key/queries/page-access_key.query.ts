import { Status } from '@/lib/shared/enums/status.enum';
import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

export class PageAccessKeysQuery extends PaginationParams implements IQuery {
  readonly domain?: string;
  readonly status?: Status;
  constructor(options: PageAccessKeysQuery) {
    super();
    Object.assign(this, options);
  }
}

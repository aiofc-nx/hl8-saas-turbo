import { Status } from '@/lib/shared/enums/status.enum';
import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

export class PageDomainsQuery extends PaginationParams implements IQuery {
  readonly name?: string;
  readonly status?: Status;
  constructor(options: PageDomainsQuery) {
    super();
    Object.assign(this, options);
  }
}

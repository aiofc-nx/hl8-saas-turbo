import { Status } from '@/lib/shared/enums/status.enum';
import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

export class PageUsersQuery extends PaginationParams implements IQuery {
  readonly username?: string;
  readonly nickName?: string;
  readonly status?: Status;
  constructor(options: PageUsersQuery) {
    super();
    Object.assign(this, options);
  }
}

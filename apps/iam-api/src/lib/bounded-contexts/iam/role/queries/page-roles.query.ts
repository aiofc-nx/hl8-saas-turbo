import { IQuery } from '@nestjs/cqrs';
import { Status } from '../../../../shared/enums/status.enum';

import { PaginationParams } from '@hl8/rest';

export class PageRolesQuery extends PaginationParams implements IQuery {
  readonly code?: string;
  readonly name?: string;
  readonly status?: Status;
  constructor(options: PageRolesQuery) {
    super();
    Object.assign(this, options);
  }
}

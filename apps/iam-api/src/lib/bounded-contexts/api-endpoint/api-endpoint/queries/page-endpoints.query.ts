import { IQuery } from '@nestjs/cqrs';

import { PaginationParams } from '@hl8/rest';

export class PageEndpointsQuery extends PaginationParams implements IQuery {
  readonly path?: string;
  readonly method?: string;
  readonly action?: string;
  readonly resource?: string;
  constructor(options: PageEndpointsQuery) {
    super();
    Object.assign(this, options);
  }
}

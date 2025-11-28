import { PaginationResult } from '@hl8/rest';

import type { DomainProperties } from '../domain/domain.read.model';
import { PageDomainsQuery } from '../queries/page-domains.query';

export interface DomainReadRepoPort {
  getDomainById(id: string): Promise<Readonly<DomainProperties> | null>;

  pageDomains(
    query: PageDomainsQuery,
  ): Promise<PaginationResult<DomainProperties>>;

  getDomainByCode(code: string): Promise<Readonly<DomainProperties> | null>;
}

import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginationResult } from '@hl8/rest';

import { ApiEndpointReadRepoPortToken } from '../../constants';
import type { EndpointProperties } from '../../domain/endpoint.read.model';
import type { ApiEndpointReadRepoPort } from '../../ports/api-endpoint.read.repo-port';
import { PageEndpointsQuery } from '../../queries/page-endpoints.query';

@QueryHandler(PageEndpointsQuery)
export class PageEndpointsQueryHandler
  implements
    IQueryHandler<PageEndpointsQuery, PaginationResult<EndpointProperties>>
{
  @Inject(ApiEndpointReadRepoPortToken)
  private readonly repository: ApiEndpointReadRepoPort;

  async execute(
    query: PageEndpointsQuery,
  ): Promise<PaginationResult<EndpointProperties>> {
    return this.repository.pageEndpoints(query);
  }
}

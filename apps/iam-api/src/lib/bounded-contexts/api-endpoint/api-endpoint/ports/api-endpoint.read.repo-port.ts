import { PaginationResult } from '@hl8/rest';

import type { EndpointProperties } from '../domain/endpoint.read.model';
import { PageEndpointsQuery } from '../queries/page-endpoints.query';

export interface ApiEndpointReadRepoPort {
  pageEndpoints(
    query: PageEndpointsQuery,
  ): Promise<PaginationResult<EndpointProperties>>;

  findEndpointsByIds(ids: string[]): Promise<EndpointProperties[]>;

  findAll(): Promise<EndpointProperties[]>;

  findAllPermissionApi(): Promise<EndpointProperties[]>;
}

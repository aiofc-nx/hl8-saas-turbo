import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginationResult } from '@hl8/rest';

import { UserReadRepoPortToken } from '../../constants';
import type { UserProperties } from '../../domain/user.read.model';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import { PageUsersQuery } from '../../queries/page-users.query';

@QueryHandler(PageUsersQuery)
export class PageUsersQueryHandler
  implements IQueryHandler<PageUsersQuery, PaginationResult<UserProperties>>
{
  @Inject(UserReadRepoPortToken) private readonly repository: UserReadRepoPort;

  async execute(
    query: PageUsersQuery,
  ): Promise<PaginationResult<UserProperties>> {
    return this.repository.pageUsers(query);
  }
}

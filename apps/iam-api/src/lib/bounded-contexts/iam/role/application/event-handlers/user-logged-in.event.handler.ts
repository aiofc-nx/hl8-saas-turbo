import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { UserLoggedInEvent } from '../../../authentication/domain/events/user-logged-in.event';

import type { ISecurityConfig } from '@hl8/config';
import { SecurityConfig } from '@hl8/config';
import { CacheConstant } from '@hl8/constants';
import { RedisUtility } from '@hl8/redis';

import { RoleReadRepoPortToken } from '../../constants';
import type { RoleReadRepoPort } from '../../ports/role.read.repo-port';

@EventsHandler(UserLoggedInEvent)
export class UserLoggedInHandler implements IEventHandler<UserLoggedInEvent> {
  constructor(
    @Inject(RoleReadRepoPortToken)
    private readonly repository: RoleReadRepoPort,
    @Inject(SecurityConfig.KEY) private securityConfig: ISecurityConfig,
  ) {}

  async handle(event: UserLoggedInEvent) {
    const userId = event.userId;
    const result = await this.repository.findRolesByUserId(userId);
    //TODO means?
    if (result.size > 0) {
      const key = `${CacheConstant.AUTH_TOKEN_PREFIX}${userId}`;
      await RedisUtility.instance.del(key);
      await RedisUtility.instance.sadd(key, ...result);
      await RedisUtility.instance.expire(key, this.securityConfig.jwtExpiresIn);
    }
  }
}

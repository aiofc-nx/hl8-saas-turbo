import { Module } from '@nestjs/common';

import { AccessKeyInfraModule } from '@/infra/bounded-contexts/access-key/access_key.infra.module';
import { ApiEndpointInfraModule } from '@/infra/bounded-contexts/api-endpoint/api-endpoint/api-endpoint.infra.module';
import { CasbinInfraModule } from '@/infra/bounded-contexts/casbin/casbin.infra.module';
import { IamModule } from '@/infra/bounded-contexts/iam/authentication/iam.module';
import { DomainInfraModule } from '@/infra/bounded-contexts/iam/domain/domain-infra.module';
import { MenuInfraModule } from '@/infra/bounded-contexts/iam/menu/menu.infra.module';
import { RoleInfraModule } from '@/infra/bounded-contexts/iam/role/role.infra.module';
import { TokensInfraModule } from '@/infra/bounded-contexts/iam/tokens/tokens.infra.module';
import { LoginLogInfraModule } from '@/infra/bounded-contexts/log-audit/login-log/login-log.infra.module';
import { OperationLogInfraModule } from '@/infra/bounded-contexts/log-audit/operation-log/operation-log.infra.module';

import { Controllers as AccessKeyRest } from './access-key/rest';
import { Controllers as CasbinRest } from './casbin/rest';
import { Controllers as EndpointRest } from './endpoint/rest';
import { Controllers as IamRest } from './iam/rest';
import { Controllers as LoginLogRest } from './log-audit/login-log/rest';
import { Controllers as OperationLogRest } from './log-audit/operation-log/rest';

/**
 * API 模块
 *
 * @description
 * 该模块聚合了 IAM 系统的所有 REST API 控制器，包括：
 * - IAM 相关：认证、授权、用户、角色、域、菜单路由
 * - API 端点管理
 * - 访问密钥管理
 * - 日志审计：登录日志、操作日志
 *
 * 该模块负责注册所有基础设施模块和控制器，是 API 层的入口模块。
 *
 * @example
 * ```typescript
 * // 在 app.module.ts 中导入
 * @Module({
 *   imports: [ApiModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    IamModule,
    MenuInfraModule,
    RoleInfraModule,
    DomainInfraModule,
    ApiEndpointInfraModule,
    OperationLogInfraModule,
    LoginLogInfraModule,
    TokensInfraModule,
    AccessKeyInfraModule,
    CasbinInfraModule,
  ],
  controllers: [
    ...IamRest,
    ...EndpointRest,
    ...LoginLogRest,
    ...OperationLogRest,
    ...AccessKeyRest,
    ...CasbinRest,
  ],
})
export class ApiModule {}

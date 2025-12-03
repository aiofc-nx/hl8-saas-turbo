import { Module } from '@nestjs/common';

import { CasbinModule } from '@/lib/bounded-contexts/casbin/casbin.module';
import {
  CasbinModelReadRepoPortToken,
  CasbinModelWriteRepoPortToken,
  CasbinPolicyReadRepoPortToken,
  CasbinPolicyWriteRepoPortToken,
} from '@/lib/bounded-contexts/casbin/constants';

import {
  CasbinModelReadPostgresRepository,
  CasbinModelWritePostgresRepository,
} from './repository/casbin-model.pg.repository';
import {
  CasbinPolicyReadPostgresRepository,
  CasbinPolicyWritePostgresRepository,
} from './repository/casbin-policy.pg.repository';

const providers = [
  {
    provide: CasbinPolicyReadRepoPortToken,
    useClass: CasbinPolicyReadPostgresRepository,
  },
  {
    provide: CasbinPolicyWriteRepoPortToken,
    useClass: CasbinPolicyWritePostgresRepository,
  },
  {
    provide: CasbinModelReadRepoPortToken,
    useClass: CasbinModelReadPostgresRepository,
  },
  {
    provide: CasbinModelWriteRepoPortToken,
    useClass: CasbinModelWritePostgresRepository,
  },
];

/**
 * Casbin 基础设施模块
 *
 * @description
 * 注册 Casbin 策略管理和模型配置管理的仓储实现，将端口适配器模式的接口绑定到具体实现。
 */
@Module({
  imports: [
    CasbinModule.register({
      inject: [...providers],
      imports: [],
    }),
  ],
  exports: [CasbinModule],
})
export class CasbinInfraModule {}

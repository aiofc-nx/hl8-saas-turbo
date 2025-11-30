import { Module } from '@nestjs/common';

import { AccessKeyModule } from '@/lib/bounded-contexts/access-key/access_key.module';
import {
  AccessKeyReadRepoPortToken,
  AccessKeyWriteRepoPortToken,
} from '@/lib/bounded-contexts/access-key/constants';

import { AccessKeyReadPostgresRepository } from './repository/access_key.read.pg.repository';
import { AccessKeyWritePostgresRepository } from './repository/access_key.write.pg.repository';

/**
 * 访问密钥仓储提供者配置
 *
 * @description
 * 配置访问密钥的仓储实现，将端口接口绑定到具体的 PostgreSQL 仓储实现。
 * 遵循依赖倒置原则，应用层依赖端口接口，基础设施层提供具体实现。
 */
const providers = [
  {
    provide: AccessKeyReadRepoPortToken,
    useClass: AccessKeyReadPostgresRepository,
  },
  {
    provide: AccessKeyWriteRepoPortToken,
    useClass: AccessKeyWritePostgresRepository,
  },
];

/**
 * 访问密钥基础设施模块
 *
 * @description
 * 访问密钥有界上下文的基础设施模块，负责：
 * 1. 注册访问密钥的仓储实现（PostgreSQL）
 * 2. 导入访问密钥应用模块
 * 3. 导出访问密钥模块供其他模块使用
 *
 * 该模块遵循 Clean Architecture 的分层原则，将基础设施层的实现与领域层和应用层解耦。
 */
@Module({
  imports: [
    AccessKeyModule.register({
      inject: [...providers],
      imports: [],
    }),
  ],
  exports: [AccessKeyModule],
})
export class AccessKeyInfraModule {}

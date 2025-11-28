import { Module } from '@nestjs/common';

import { AuthZModule } from '@hl8/casbin';

import {
  DomainReadRepoPortToken,
  DomainWriteRepoPortToken,
} from '@/lib/bounded-contexts/iam/domain/constants';
import { DomainModule } from '@/lib/bounded-contexts/iam/domain/domain.module';

import { DomainReadRepository } from './repository/domain.read.pg.repository';
import { DomainWriteRepository } from './repository/domain.write.pg.repository';

const providers = [
  {
    provide: DomainReadRepoPortToken,
    useClass: DomainReadRepository,
  },
  {
    provide: DomainWriteRepoPortToken,
    useClass: DomainWriteRepository,
  },
];

@Module({
  imports: [
    DomainModule.register({
      inject: [...providers],
      imports: [],
    }),
    // 导入 AuthZModule 以使用 AuthZManagementService
    // 虽然 AuthZModule 是全局的，但显式导入可以确保依赖解析正确
    AuthZModule,
  ],
  exports: [DomainModule],
})
export class DomainInfraModule {}

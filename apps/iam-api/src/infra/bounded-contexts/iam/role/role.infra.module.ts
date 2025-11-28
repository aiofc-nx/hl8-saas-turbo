import { Module } from '@nestjs/common';

import { AuthZModule } from '@hl8/casbin';

import {
  RoleReadRepoPortToken,
  RoleWriteRepoPortToken,
} from '@/lib/bounded-contexts/iam/role/constants';
import { RoleModule } from '@/lib/bounded-contexts/iam/role/role.module';

import { RoleReadPostgresRepository } from './repository/role.read.pg.repository';
import { RoleWritePostgresRepository } from './repository/role.write.pg.repository';

const providers = [
  { provide: RoleReadRepoPortToken, useClass: RoleReadPostgresRepository },
  { provide: RoleWriteRepoPortToken, useClass: RoleWritePostgresRepository },
];

@Module({
  imports: [
    RoleModule.register({
      inject: [...providers],
      imports: [],
    }),
    // 导入 AuthZModule 以使用 AuthZManagementService
    // 虽然 AuthZModule 是全局的，但显式导入可以确保依赖解析正确
    AuthZModule,
  ],
  exports: [RoleModule],
})
export class RoleInfraModule {}

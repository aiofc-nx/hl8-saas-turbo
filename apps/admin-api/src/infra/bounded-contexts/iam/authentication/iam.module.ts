import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthZModule } from '@hl8/casbin';
import { ConfigKeyPaths, ISecurityConfig, securityRegToken } from '@hl8/config';

import { AuthenticationModule } from '@/lib/bounded-contexts/iam/authentication/authentication.module';
import {
  UserReadRepoPortToken,
  UserWriteRepoPortToken,
} from '@/lib/bounded-contexts/iam/authentication/constants';

import { UserReadRepository } from './repository/user.read.pg.repository';
import { UserWriteRepository } from './repository/user.write.pg.repository';

const providers = [
  { provide: UserReadRepoPortToken, useClass: UserReadRepository },
  { provide: UserWriteRepoPortToken, useClass: UserWriteRepository },
];

@Module({
  imports: [
    AuthenticationModule.register({
      inject: [...providers],
      imports: [
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
            const { jwtSecret, jwtExpiresIn } =
              configService.get<ISecurityConfig>(securityRegToken, {
                infer: true,
              });

            return {
              secret: jwtSecret,
              signOptions: {
                expiresIn: `${jwtExpiresIn}s`,
              },
            };
          },
          inject: [ConfigService],
        }),
      ],
    }),
    // 导入 AuthZModule 以使用 AuthZRBACService
    // 虽然 AuthZModule 是全局的，但显式导入可以确保依赖解析正确
    AuthZModule,
  ],
  providers: [...providers],
  exports: [AuthenticationModule, UserReadRepoPortToken],
})
export class IamModule {}

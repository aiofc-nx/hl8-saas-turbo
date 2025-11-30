import { Inject, Logger, OnModuleInit } from '@nestjs/common';

import type { IApiKeyService } from '@hl8/guard';
import {
  ComplexApiKeyServiceToken,
  SimpleApiKeyServiceToken,
} from '@hl8/guard';

import { AccessKeyReadRepoPortToken } from '../../constants';
import type { AccessKeyReadRepoPort } from '../../ports/access_key.read.repo-port';

/**
 * AccessKey 引导查询处理器
 *
 * @description 在模块初始化时加载所有 AccessKey 到内存中，用于 API Key 认证
 * 如果实体未定义或查询失败，会记录警告但不阻塞应用启动
 */
export class AccessBootstrapQueryHandler implements OnModuleInit {
  private readonly logger = new Logger(AccessBootstrapQueryHandler.name);

  constructor(
    @Inject(AccessKeyReadRepoPortToken)
    private readonly repository: AccessKeyReadRepoPort,
    @Inject(SimpleApiKeyServiceToken)
    private readonly simpleApiKeyService: IApiKeyService,
    @Inject(ComplexApiKeyServiceToken)
    private readonly complexApiKeyService: IApiKeyService,
  ) {}

  async onModuleInit() {
    try {
      const allKeys = await this.repository.findAll();

      this.logger.log(`Loading ${allKeys.length} access keys into memory`);

      await Promise.all(
        allKeys.flatMap((key) => [
          this.complexApiKeyService.addKey(
            key.AccessKeyID,
            key.AccessKeySecret,
          ),
          this.simpleApiKeyService.addKey(key.AccessKeyID),
        ]),
      );

      this.logger.log('Access keys loaded successfully');
    } catch (error) {
      // 实体未定义或数据库连接问题不应该阻塞应用启动
      this.logger.warn(
        `Failed to load access keys during bootstrap: ${error instanceof Error ? error.message : String(error)}. ` +
          'The application will continue to start, but API Key authentication may not work until entities are properly configured.',
      );
    }
  }
}

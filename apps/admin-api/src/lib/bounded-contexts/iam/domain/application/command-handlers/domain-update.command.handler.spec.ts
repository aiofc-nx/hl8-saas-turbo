import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Status } from '@/lib/shared/enums/status.enum';

import { DomainUpdateCommand } from '../../commands/domain-update.command';
import {
  DomainReadRepoPortToken,
  DomainWriteRepoPortToken,
} from '../../constants';
import type { DomainProperties } from '../../domain/domain.read.model';
import type { DomainReadRepoPort } from '../../ports/domain.read.repo-port';
import type { DomainWriteRepoPort } from '../../ports/domain.write.repo-port';
import { DomainUpdateHandler } from './domain-update.command.handler';

/**
 * DomainUpdateHandler 单元测试
 *
 * @description
 * 测试域更新命令处理器的业务逻辑。
 */
describe('DomainUpdateHandler', () => {
  let handler: DomainUpdateHandler;
  let domainWriteRepository: jest.Mocked<DomainWriteRepoPort>;
  let domainReadRepoPort: jest.Mocked<DomainReadRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockDomainWriteRepository: DomainWriteRepoPort = {
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    } as unknown as jest.Mocked<DomainWriteRepoPort>;

    const mockDomainReadRepoPort: DomainReadRepoPort = {
      getDomainById: jest.fn(),
      getDomainByCode: jest.fn(),
      pageDomains: jest.fn(),
    } as unknown as jest.Mocked<DomainReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainUpdateHandler,
        {
          provide: DomainWriteRepoPortToken,
          useValue: mockDomainWriteRepository,
        },
        {
          provide: DomainReadRepoPortToken,
          useValue: mockDomainReadRepoPort,
        },
      ],
    }).compile();

    handler = module.get<DomainUpdateHandler>(DomainUpdateHandler);
    domainWriteRepository = module.get(DomainWriteRepoPortToken);
    domainReadRepoPort = module.get(DomainReadRepoPortToken);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    /**
     * 应该成功更新域
     *
     * 验证当提供有效的命令时，处理器能够正确更新域。
     */
    it('应该成功更新域', async () => {
      const domainId = 'domain-123';
      const command = new DomainUpdateCommand(
        domainId,
        'updated-domain',
        '更新后的域',
        '更新后的描述',
        'user-123',
      );

      const existingDomain: DomainProperties = {
        id: domainId,
        code: 'old-domain',
        name: '原域',
        status: Status.ENABLED,
        description: '原描述',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (domainReadRepoPort.getDomainByCode as jest.Mock).mockResolvedValue(
        existingDomain,
      );

      await handler.execute(command);

      expect(domainReadRepoPort.getDomainByCode).toHaveBeenCalledWith(
        'updated-domain',
      );
      expect(domainWriteRepository.update).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该抛出异常当域代码已被其他域使用时
     *
     * 验证当域代码已被其他域使用时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当域代码已被其他域使用时', async () => {
      const domainId = 'domain-123';
      const command = new DomainUpdateCommand(
        domainId,
        'existing-domain',
        '域名称',
        '描述',
        'user-123',
      );

      const existingDomain: DomainProperties = {
        id: domainId,
        code: 'old-domain',
        name: '原域',
        status: Status.ENABLED,
        description: '原描述',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      const domainWithSameCode: DomainProperties = {
        id: 'other-domain-id', // 不同的域 ID
        code: 'existing-domain',
        name: '已存在域',
        status: Status.ENABLED,
        description: '描述',
        createdAt: new Date(),
        createdBy: 'user-2',
      };

      (domainReadRepoPort.getDomainByCode as jest.Mock).mockResolvedValue(
        domainWithSameCode,
      );

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'A domain with code existing-domain already exists.',
      );
      expect(domainWriteRepository.update).not.toHaveBeenCalled();
    });
  });
});

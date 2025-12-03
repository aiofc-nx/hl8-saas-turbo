import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Status } from '@/lib/shared/enums/status.enum';

import { DomainCreateCommand } from '../../commands/domain-create.command';
import {
  DomainReadRepoPortToken,
  DomainWriteRepoPortToken,
} from '../../constants';
import type { DomainProperties } from '../../domain/domain.read.model';
import type { DomainReadRepoPort } from '../../ports/domain.read.repo-port';
import type { DomainWriteRepoPort } from '../../ports/domain.write.repo-port';
import { DomainCreateHandler } from './domain-create.command.handler';

/**
 * DomainCreateHandler 单元测试
 *
 * @description
 * 测试域创建命令处理器的业务逻辑。
 */
describe('DomainCreateHandler', () => {
  let handler: DomainCreateHandler;
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
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<DomainWriteRepoPort>;

    const mockDomainReadRepoPort: DomainReadRepoPort = {
      getDomainById: jest.fn(),
      getDomainByCode: jest.fn(),
      pageDomains: jest.fn(),
    } as unknown as jest.Mocked<DomainReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainCreateHandler,
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

    handler = module.get<DomainCreateHandler>(DomainCreateHandler);
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
     * 应该成功创建域
     *
     * 验证当提供有效的命令时，处理器能够正确创建域。
     */
    it('应该成功创建域', async () => {
      const command = new DomainCreateCommand(
        'example',
        '示例域',
        '这是一个示例域',
        'user-123',
      );

      (domainReadRepoPort.getDomainByCode as jest.Mock).mockResolvedValue(null);

      await handler.execute(command);

      expect(domainReadRepoPort.getDomainByCode).toHaveBeenCalledWith(
        'example',
      );
      expect(domainWriteRepository.save).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该抛出异常当域代码已存在时
     *
     * 验证当域代码已存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当域代码已存在时', async () => {
      const command = new DomainCreateCommand(
        'existing-domain',
        '已存在域',
        '描述',
        'user-123',
      );

      const existingDomain: DomainProperties = {
        id: 'existing-domain-id',
        code: 'existing-domain',
        name: '已存在域',
        status: Status.ENABLED,
        description: '描述',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (domainReadRepoPort.getDomainByCode as jest.Mock).mockResolvedValue(
        existingDomain,
      );

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'A domain with code existing-domain already exists.',
      );
      expect(domainWriteRepository.save).not.toHaveBeenCalled();
    });
  });
});

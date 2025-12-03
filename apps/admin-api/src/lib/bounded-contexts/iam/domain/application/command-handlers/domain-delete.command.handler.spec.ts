import { BadRequestException } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { Status } from '@/lib/shared/enums/status.enum';

import { DomainDeleteCommand } from '../../commands/domain-delete.command';
import {
  DomainReadRepoPortToken,
  DomainWriteRepoPortToken,
} from '../../constants';
import type { DomainProperties } from '../../domain/domain.read.model';
import type { DomainReadRepoPort } from '../../ports/domain.read.repo-port';
import type { DomainWriteRepoPort } from '../../ports/domain.write.repo-port';
import { DomainDeleteHandler } from './domain-delete.command.handler';

/**
 * DomainDeleteHandler 单元测试
 *
 * @description
 * 测试域删除命令处理器的业务逻辑。
 */
describe('DomainDeleteHandler', () => {
  let handler: DomainDeleteHandler;
  let domainWriteRepository: jest.Mocked<DomainWriteRepoPort>;
  let domainReadRepoPort: jest.Mocked<DomainReadRepoPort>;
  let publisher: jest.Mocked<EventPublisher>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockDomainWriteRepository: DomainWriteRepoPort = {
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<DomainWriteRepoPort>;

    const mockDomainReadRepoPort: DomainReadRepoPort = {
      getDomainById: jest.fn(),
      getDomainByCode: jest.fn(),
      pageDomains: jest.fn(),
    } as unknown as jest.Mocked<DomainReadRepoPort>;

    const mockPublisher = {
      mergeObjectContext: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<EventPublisher>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainDeleteHandler,
        {
          provide: DomainWriteRepoPortToken,
          useValue: mockDomainWriteRepository,
        },
        {
          provide: DomainReadRepoPortToken,
          useValue: mockDomainReadRepoPort,
        },
        {
          provide: EventPublisher,
          useValue: mockPublisher,
        },
      ],
    }).compile();

    handler = module.get<DomainDeleteHandler>(DomainDeleteHandler);
    domainWriteRepository = module.get(DomainWriteRepoPortToken);
    domainReadRepoPort = module.get(DomainReadRepoPortToken);
    publisher = module.get(EventPublisher);
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
     * 应该成功删除域
     *
     * 验证当提供有效的命令时，处理器能够正确删除域。
     */
    it('应该成功删除域', async () => {
      const command = new DomainDeleteCommand('domain-123');

      const existingDomain: DomainProperties = {
        id: 'domain-123',
        code: 'example',
        name: '示例域',
        status: Status.ENABLED,
        description: '描述',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (domainReadRepoPort.getDomainById as jest.Mock).mockResolvedValue(
        existingDomain,
      );

      await handler.execute(command);

      expect(domainReadRepoPort.getDomainById).toHaveBeenCalledWith(
        'domain-123',
      );
      expect(domainWriteRepository.delete).toHaveBeenCalledTimes(1);
      expect(publisher.mergeObjectContext).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当域不存在时
     *
     * 验证当域不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当域不存在时', async () => {
      const command = new DomainDeleteCommand('non-existent-domain');

      (domainReadRepoPort.getDomainById as jest.Mock).mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'A domain with the specified ID does not exist.',
      );
      expect(domainWriteRepository.delete).not.toHaveBeenCalled();
    });
  });
});

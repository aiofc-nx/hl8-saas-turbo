import { Test, TestingModule } from '@nestjs/testing';

import { DomainDeletedEvent } from '../../../domain/domain/events/domain-deleted.event';
import { UserWriteRepoPortToken } from '../../constants';
import type { UserWriteRepoPort } from '../../ports/user.write.repo-port';
import { DomainDeletedHandler } from './domain-deleted.event.handler';

/**
 * DomainDeletedHandler 单元测试
 *
 * @description
 * 测试域删除事件处理器的业务逻辑。
 */
describe('DomainDeletedHandler', () => {
  let handler: DomainDeletedHandler;
  let userWriteRepository: jest.Mocked<UserWriteRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 用户写入仓储
    const mockUserWriteRepository: UserWriteRepoPort = {
      save: jest.fn(),
      update: jest.fn(),
      deleteById: jest.fn(),
      deleteUserRoleByDomain: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<UserWriteRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainDeletedHandler,
        {
          provide: UserWriteRepoPortToken,
          useValue: mockUserWriteRepository,
        },
      ],
    }).compile();

    handler = module.get<DomainDeletedHandler>(DomainDeletedHandler);
    userWriteRepository = module.get(UserWriteRepoPortToken);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    /**
     * 应该成功处理域删除事件
     *
     * 验证当域删除事件发生时，处理器能够正确删除用户角色关联。
     */
    it('应该成功处理域删除事件', async () => {
      const event = new DomainDeletedEvent('domain-123', 'example.com');

      await handler.handle(event);

      expect(userWriteRepository.deleteUserRoleByDomain).toHaveBeenCalledWith(
        'example.com',
      );
      expect(userWriteRepository.deleteUserRoleByDomain).toHaveBeenCalledTimes(
        1,
      );
    });

    /**
     * 应该正确处理删除操作异常
     *
     * 验证当删除操作失败时，处理器能够正确传播异常。
     */
    it('应该正确处理删除操作异常', async () => {
      const event = new DomainDeletedEvent('domain-123', 'example.com');

      const error = new Error('数据库连接失败');
      (
        userWriteRepository.deleteUserRoleByDomain as jest.Mock
      ).mockRejectedValue(error);

      await expect(handler.handle(event)).rejects.toThrow('数据库连接失败');
      expect(userWriteRepository.deleteUserRoleByDomain).toHaveBeenCalledWith(
        'example.com',
      );
    });

    /**
     * 应该使用事件中的域代码
     *
     * 验证处理器使用事件中提供的域代码进行删除操作。
     */
    it('应该使用事件中的域代码', async () => {
      const domainCode = 'test.com';
      const event = new DomainDeletedEvent('domain-456', domainCode);

      await handler.handle(event);

      expect(userWriteRepository.deleteUserRoleByDomain).toHaveBeenCalledWith(
        domainCode,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';

import { RoleDeletedEvent } from '../../../role/domain/events/role-deleted.event';
import { UserWriteRepoPortToken } from '../../constants';
import type { UserWriteRepoPort } from '../../ports/user.write.repo-port';
import { RoleDeletedHandler } from './role-deleted.event.handler';

/**
 * RoleDeletedHandler 单元测试
 *
 * @description
 * 测试角色删除事件处理器的业务逻辑。
 */
describe('RoleDeletedHandler', () => {
  let handler: RoleDeletedHandler;
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
      deleteUserRoleByRoleId: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<UserWriteRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleDeletedHandler,
        {
          provide: UserWriteRepoPortToken,
          useValue: mockUserWriteRepository,
        },
      ],
    }).compile();

    handler = module.get<RoleDeletedHandler>(RoleDeletedHandler);
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
     * 应该成功处理角色删除事件
     *
     * 验证当角色删除事件发生时，处理器能够正确删除用户角色关联。
     */
    it('应该成功处理角色删除事件', async () => {
      const event = new RoleDeletedEvent('role-123', 'admin');

      await handler.handle(event);

      expect(userWriteRepository.deleteUserRoleByRoleId).toHaveBeenCalledWith(
        'role-123',
      );
      expect(userWriteRepository.deleteUserRoleByRoleId).toHaveBeenCalledTimes(
        1,
      );
    });

    /**
     * 应该正确处理删除操作异常
     *
     * 验证当删除操作失败时，处理器能够正确传播异常。
     */
    it('应该正确处理删除操作异常', async () => {
      const event = new RoleDeletedEvent('role-123', 'admin');

      const error = new Error('数据库连接失败');
      (
        userWriteRepository.deleteUserRoleByRoleId as jest.Mock
      ).mockRejectedValue(error);

      await expect(handler.handle(event)).rejects.toThrow('数据库连接失败');
      expect(userWriteRepository.deleteUserRoleByRoleId).toHaveBeenCalledWith(
        'role-123',
      );
    });

    /**
     * 应该使用事件中的角色ID
     *
     * 验证处理器使用事件中提供的角色ID进行删除操作。
     */
    it('应该使用事件中的角色ID', async () => {
      const roleId = 'role-456';
      const event = new RoleDeletedEvent(roleId, 'user');

      await handler.handle(event);

      expect(userWriteRepository.deleteUserRoleByRoleId).toHaveBeenCalledWith(
        roleId,
      );
    });
  });
});

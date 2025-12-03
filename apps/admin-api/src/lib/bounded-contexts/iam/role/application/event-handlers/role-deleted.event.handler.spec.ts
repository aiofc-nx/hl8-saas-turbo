import { Test, TestingModule } from '@nestjs/testing';

import { AuthZManagementService } from '@hl8/casbin';

import { RoleWriteRepoPortToken } from '../../constants';
import { RoleDeletedEvent } from '../../domain/events/role-deleted.event';
import type { RoleWriteRepoPort } from '../../ports/role.write.repo-port';
import { RoleDeletedHandler } from './role-deleted.event.handler';

/**
 * RoleDeletedHandler 单元测试
 *
 * 测试角色删除事件处理器的业务逻辑。
 */
describe('RoleDeletedHandler', () => {
  let handler: RoleDeletedHandler;
  let authZManagementService: AuthZManagementService;
  let roleWriteRepository: RoleWriteRepoPort;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 授权管理服务
    const mockAuthZManagementService = {
      removeFilteredPolicy: jest.fn().mockResolvedValue(undefined),
      addPolicy: jest.fn(),
      removePolicy: jest.fn(),
    };

    // 创建 Mock 角色写入仓储
    const mockRoleWriteRepository: RoleWriteRepoPort = {
      save: jest.fn(),
      deleteById: jest.fn(),
      update: jest.fn(),
      deleteRoleMenuByRoleId: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleDeletedHandler,
        {
          provide: AuthZManagementService,
          useValue: mockAuthZManagementService,
        },
        {
          provide: RoleWriteRepoPortToken,
          useValue: mockRoleWriteRepository,
        },
      ],
    }).compile();

    handler = module.get<RoleDeletedHandler>(RoleDeletedHandler);
    authZManagementService = module.get<AuthZManagementService>(
      AuthZManagementService,
    );
    roleWriteRepository = module.get<RoleWriteRepoPort>(RoleWriteRepoPortToken);
  });

  /**
   * 应该成功处理角色删除事件
   *
   * 验证当提供有效的事件时，处理器能够正确删除相关的 Casbin 策略和角色菜单关系。
   */
  it('应该成功处理角色删除事件', async () => {
    const event = new RoleDeletedEvent('role-123', 'admin');

    await handler.handle(event);

    expect(authZManagementService.removeFilteredPolicy).toHaveBeenCalledWith(
      0,
      'admin',
    );
    expect(roleWriteRepository.deleteRoleMenuByRoleId).toHaveBeenCalledWith(
      'role-123',
    );
  });

  /**
   * 应该使用正确的事件参数
   *
   * 验证处理器使用事件对象中的正确角色 ID 和角色代码。
   */
  it('应该使用正确的事件参数', async () => {
    const roleId = 'role-456';
    const roleCode = 'user';
    const event = new RoleDeletedEvent(roleId, roleCode);

    await handler.handle(event);

    expect(authZManagementService.removeFilteredPolicy).toHaveBeenCalledWith(
      0,
      roleCode,
    );
    expect(roleWriteRepository.deleteRoleMenuByRoleId).toHaveBeenCalledWith(
      roleId,
    );
    expect(
      authZManagementService.removeFilteredPolicy,
    ).not.toHaveBeenCalledWith(0, 'wrong-code');
    expect(roleWriteRepository.deleteRoleMenuByRoleId).not.toHaveBeenCalledWith(
      'wrong-id',
    );
  });

  /**
   * 应该正确处理删除 Casbin 策略失败的情况
   *
   * 验证当删除 Casbin 策略失败时，处理器能够正确处理异常。
   */
  it('应该正确处理删除 Casbin 策略失败的情况', async () => {
    const event = new RoleDeletedEvent('role-123', 'admin');
    const error = new Error('删除策略失败');

    (
      authZManagementService.removeFilteredPolicy as jest.Mock
    ).mockRejectedValue(error);

    await expect(handler.handle(event)).rejects.toThrow('删除策略失败');
    expect(roleWriteRepository.deleteRoleMenuByRoleId).not.toHaveBeenCalled();
  });

  /**
   * 应该正确处理删除角色菜单关系失败的情况
   *
   * 验证当删除角色菜单关系失败时，处理器能够正确处理异常。
   */
  it('应该正确处理删除角色菜单关系失败的情况', async () => {
    const event = new RoleDeletedEvent('role-123', 'admin');
    const error = new Error('删除角色菜单关系失败');

    (roleWriteRepository.deleteRoleMenuByRoleId as jest.Mock).mockRejectedValue(
      error,
    );

    await expect(handler.handle(event)).rejects.toThrow('删除角色菜单关系失败');
    expect(authZManagementService.removeFilteredPolicy).toHaveBeenCalled();
  });
});

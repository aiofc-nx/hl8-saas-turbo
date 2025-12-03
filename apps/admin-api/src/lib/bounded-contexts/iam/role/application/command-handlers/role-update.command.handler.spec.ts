import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ROOT_PID } from '@/lib/shared/constants/db.constant';
import { Status } from '@/lib/shared/enums/status.enum';

import { RoleUpdateCommand } from '../../commands/role-update.command';
import { RoleReadRepoPortToken, RoleWriteRepoPortToken } from '../../constants';
import type { RoleProperties } from '../../domain/role.read.model';
import type { RoleReadRepoPort } from '../../ports/role.read.repo-port';
import type { RoleWriteRepoPort } from '../../ports/role.write.repo-port';
import { RoleUpdateHandler } from './role-update.command.handler';

/**
 * RoleUpdateHandler 单元测试
 *
 * @description
 * 测试角色更新命令处理器的业务逻辑。
 */
describe('RoleUpdateHandler', () => {
  let handler: RoleUpdateHandler;
  let roleWriteRepository: jest.Mocked<RoleWriteRepoPort>;
  let roleReadRepoPort: jest.Mocked<RoleReadRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRoleWriteRepository: RoleWriteRepoPort = {
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<RoleWriteRepoPort>;

    const mockRoleReadRepoPort: RoleReadRepoPort = {
      getRoleById: jest.fn(),
      getRoleByCode: jest.fn(),
      getRolesByDomain: jest.fn(),
      getRolesByCodes: jest.fn(),
      getRoleCodesByUserId: jest.fn(),
      pageRoles: jest.fn(),
    } as unknown as jest.Mocked<RoleReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleUpdateHandler,
        {
          provide: RoleWriteRepoPortToken,
          useValue: mockRoleWriteRepository,
        },
        {
          provide: RoleReadRepoPortToken,
          useValue: mockRoleReadRepoPort,
        },
      ],
    }).compile();

    handler = module.get<RoleUpdateHandler>(RoleUpdateHandler);
    roleWriteRepository = module.get(RoleWriteRepoPortToken);
    roleReadRepoPort = module.get(RoleReadRepoPortToken);
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
     * 应该成功更新角色
     *
     * 验证当提供有效的命令时，处理器能够正确更新角色。
     */
    it('应该成功更新角色', async () => {
      const roleId = 'role-123';
      const command = new RoleUpdateCommand(
        roleId,
        'updated-role',
        '更新后的角色',
        ROOT_PID,
        Status.ENABLED,
        '更新后的描述',
        'user-123',
      );

      const existingRole: RoleProperties = {
        id: roleId,
        code: 'old-role',
        name: '原角色',
        status: Status.ENABLED,
        domain: 'example.com',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (roleReadRepoPort.getRoleByCode as jest.Mock).mockResolvedValue(
        existingRole,
      );

      await handler.execute(command);

      expect(roleReadRepoPort.getRoleByCode).toHaveBeenCalledWith(
        'updated-role',
      );
      expect(roleWriteRepository.update).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该抛出异常当角色代码已被其他角色使用时
     *
     * 验证当角色代码已被其他角色使用时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当角色代码已被其他角色使用时', async () => {
      const roleId = 'role-123';
      const command = new RoleUpdateCommand(
        roleId,
        'existing-role',
        '角色名称',
        ROOT_PID,
        Status.ENABLED,
        '描述',
        'user-123',
      );

      const existingRole: RoleProperties = {
        id: roleId,
        code: 'old-role',
        name: '原角色',
        status: Status.ENABLED,
        domain: 'example.com',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      const roleWithSameCode: RoleProperties = {
        id: 'other-role-id', // 不同的角色 ID
        code: 'existing-role',
        name: '已存在角色',
        status: Status.ENABLED,
        domain: 'example.com',
        createdAt: new Date(),
        createdBy: 'user-2',
      };

      (roleReadRepoPort.getRoleByCode as jest.Mock).mockResolvedValue(
        roleWithSameCode,
      );

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'A role with code existing-role already exists.',
      );
      expect(roleWriteRepository.update).not.toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当父角色ID与自身ID相同时
     *
     * 验证当父角色ID与自身ID相同时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当父角色ID与自身ID相同时', async () => {
      const roleId = 'role-123';
      const command = new RoleUpdateCommand(
        roleId,
        'role-code',
        '角色名称',
        roleId, // 父角色ID与自身ID相同
        Status.ENABLED,
        '描述',
        'user-123',
      );

      const existingRole: RoleProperties = {
        id: roleId,
        code: 'role-code',
        name: '角色',
        status: Status.ENABLED,
        domain: 'example.com',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (roleReadRepoPort.getRoleByCode as jest.Mock).mockResolvedValue(
        existingRole,
      );

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        `The parent role identifier '${roleId}' cannot be the same as its own identifier.`,
      );
      expect(roleWriteRepository.update).not.toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当父角色不存在时
     *
     * 验证当父角色不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当父角色不存在时', async () => {
      const roleId = 'role-123';
      const parentRoleId = 'non-existent-parent';
      const command = new RoleUpdateCommand(
        roleId,
        'role-code',
        '角色名称',
        parentRoleId,
        Status.ENABLED,
        '描述',
        'user-123',
      );

      const existingRole: RoleProperties = {
        id: roleId,
        code: 'role-code',
        name: '角色',
        status: Status.ENABLED,
        domain: 'example.com',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (roleReadRepoPort.getRoleByCode as jest.Mock).mockResolvedValue(
        existingRole,
      );
      (roleReadRepoPort.getRoleById as jest.Mock).mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        `Parent role with code ${parentRoleId} does not exist.`,
      );
      expect(roleWriteRepository.update).not.toHaveBeenCalled();
    });
  });
});

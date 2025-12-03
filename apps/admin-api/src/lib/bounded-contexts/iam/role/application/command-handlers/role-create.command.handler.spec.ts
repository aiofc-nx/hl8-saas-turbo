import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ROOT_PID } from '@/lib/shared/constants/db.constant';
import { Status } from '@/lib/shared/enums/status.enum';

import { RoleCreateCommand } from '../../commands/role-create.command';
import { RoleReadRepoPortToken, RoleWriteRepoPortToken } from '../../constants';
import type { RoleProperties } from '../../domain/role.read.model';
import type { RoleReadRepoPort } from '../../ports/role.read.repo-port';
import type { RoleWriteRepoPort } from '../../ports/role.write.repo-port';
import { RoleCreateHandler } from './role-create.command.handler';

/**
 * RoleCreateHandler 单元测试
 *
 * @description
 * 测试角色创建命令处理器的业务逻辑。
 */
describe('RoleCreateHandler', () => {
  let handler: RoleCreateHandler;
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
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
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
        RoleCreateHandler,
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

    handler = module.get<RoleCreateHandler>(RoleCreateHandler);
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
     * 应该成功创建角色（根角色）
     *
     * 验证当提供有效的命令且为根角色时，处理器能够正确创建角色。
     */
    it('应该成功创建角色（根角色）', async () => {
      const command = new RoleCreateCommand(
        'admin',
        '管理员',
        ROOT_PID,
        Status.ENABLED,
        '管理员角色',
        'user-123',
      );

      (roleReadRepoPort.getRoleByCode as jest.Mock).mockResolvedValue(null);

      await handler.execute(command);

      expect(roleReadRepoPort.getRoleByCode).toHaveBeenCalledWith('admin');
      expect(roleWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(roleReadRepoPort.getRoleById).not.toHaveBeenCalled(); // 根角色不需要验证父角色
    });

    /**
     * 应该成功创建角色（有父角色）
     *
     * 验证当提供有效的命令且有父角色时，处理器能够正确创建角色。
     */
    it('应该成功创建角色（有父角色）', async () => {
      const parentRoleId = 'parent-role-id';
      const command = new RoleCreateCommand(
        'sub-admin',
        '子管理员',
        parentRoleId,
        Status.ENABLED,
        '子管理员角色',
        'user-123',
      );

      const parentRole: RoleProperties = {
        id: parentRoleId,
        code: 'parent',
        name: '父角色',
        status: Status.ENABLED,
        domain: 'example.com',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (roleReadRepoPort.getRoleByCode as jest.Mock).mockResolvedValue(null);
      (roleReadRepoPort.getRoleById as jest.Mock).mockResolvedValue(parentRole);

      await handler.execute(command);

      expect(roleReadRepoPort.getRoleByCode).toHaveBeenCalledWith('sub-admin');
      expect(roleReadRepoPort.getRoleById).toHaveBeenCalledWith(parentRoleId);
      expect(roleWriteRepository.save).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该抛出异常当角色代码已存在时
     *
     * 验证当角色代码已存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当角色代码已存在时', async () => {
      const command = new RoleCreateCommand(
        'existing-role',
        '已存在角色',
        ROOT_PID,
        Status.ENABLED,
        '描述',
        'user-123',
      );

      const existingRole: RoleProperties = {
        id: 'existing-role-id',
        code: 'existing-role',
        name: '已存在角色',
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
        'A role with code existing-role already exists.',
      );
      expect(roleWriteRepository.save).not.toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当父角色不存在时
     *
     * 验证当父角色不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当父角色不存在时', async () => {
      const parentRoleId = 'non-existent-parent';
      const command = new RoleCreateCommand(
        'sub-role',
        '子角色',
        parentRoleId,
        Status.ENABLED,
        '描述',
        'user-123',
      );

      (roleReadRepoPort.getRoleByCode as jest.Mock).mockResolvedValue(null);
      (roleReadRepoPort.getRoleById as jest.Mock).mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        `Parent role with code ${parentRoleId} does not exist.`,
      );
      expect(roleWriteRepository.save).not.toHaveBeenCalled();
    });
  });
});

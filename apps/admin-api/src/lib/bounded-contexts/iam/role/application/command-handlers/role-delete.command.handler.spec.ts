import { BadRequestException } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { Status } from '@/lib/shared/enums/status.enum';

import { RoleDeleteCommand } from '../../commands/role-delete.command';
import { RoleReadRepoPortToken, RoleWriteRepoPortToken } from '../../constants';
import type { RoleProperties } from '../../domain/role.read.model';
import type { RoleReadRepoPort } from '../../ports/role.read.repo-port';
import type { RoleWriteRepoPort } from '../../ports/role.write.repo-port';
import { RoleDeleteHandler } from './role-delete.command.handler';

/**
 * RoleDeleteHandler 单元测试
 *
 * @description
 * 测试角色删除命令处理器的业务逻辑。
 */
describe('RoleDeleteHandler', () => {
  let handler: RoleDeleteHandler;
  let roleWriteRepository: jest.Mocked<RoleWriteRepoPort>;
  let roleReadRepoPort: jest.Mocked<RoleReadRepoPort>;
  let publisher: jest.Mocked<EventPublisher>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRoleWriteRepository: RoleWriteRepoPort = {
      save: jest.fn(),
      update: jest.fn(),
      deleteById: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<RoleWriteRepoPort>;

    const mockRoleReadRepoPort: RoleReadRepoPort = {
      getRoleById: jest.fn(),
      getRoleByCode: jest.fn(),
      getRolesByDomain: jest.fn(),
      getRolesByCodes: jest.fn(),
      getRoleCodesByUserId: jest.fn(),
      pageRoles: jest.fn(),
    } as unknown as jest.Mocked<RoleReadRepoPort>;

    const mockPublisher = {
      mergeObjectContext: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<EventPublisher>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleDeleteHandler,
        {
          provide: RoleWriteRepoPortToken,
          useValue: mockRoleWriteRepository,
        },
        {
          provide: RoleReadRepoPortToken,
          useValue: mockRoleReadRepoPort,
        },
        {
          provide: EventPublisher,
          useValue: mockPublisher,
        },
      ],
    }).compile();

    handler = module.get<RoleDeleteHandler>(RoleDeleteHandler);
    roleWriteRepository = module.get(RoleWriteRepoPortToken);
    roleReadRepoPort = module.get(RoleReadRepoPortToken);
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
     * 应该成功删除角色
     *
     * 验证当提供有效的命令时，处理器能够正确删除角色。
     */
    it('应该成功删除角色', async () => {
      const command = new RoleDeleteCommand('role-123');

      const existingRole: RoleProperties = {
        id: 'role-123',
        code: 'admin',
        name: '管理员',
        status: Status.ENABLED,
        domain: 'example.com',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      (roleReadRepoPort.getRoleById as jest.Mock).mockResolvedValue(
        existingRole,
      );

      await handler.execute(command);

      expect(roleReadRepoPort.getRoleById).toHaveBeenCalledWith('role-123');
      expect(roleWriteRepository.deleteById).toHaveBeenCalledWith('role-123');
      expect(publisher.mergeObjectContext).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当角色不存在时
     *
     * 验证当角色不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当角色不存在时', async () => {
      const command = new RoleDeleteCommand('non-existent-role');

      (roleReadRepoPort.getRoleById as jest.Mock).mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'A role with the specified ID does not exist.',
      );
      expect(roleWriteRepository.deleteById).not.toHaveBeenCalled();
    });
  });
});

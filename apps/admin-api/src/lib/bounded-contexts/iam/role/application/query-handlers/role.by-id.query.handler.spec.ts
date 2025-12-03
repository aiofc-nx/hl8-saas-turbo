import { Test, TestingModule } from '@nestjs/testing';

import { RoleReadRepoPortToken } from '../../constants';
import type { RoleProperties } from '../../domain/role.read.model';
import type { RoleReadRepoPort } from '../../ports/role.read.repo-port';
import { FindRoleByIdQuery } from '../../queries/role.by-id.query';
import { FindRoleByIdQueryHandler } from './role.by-id.query.handler';

/**
 * FindRoleByIdQueryHandler 单元测试
 *
 * 测试根据 ID 查询角色的查询处理器。
 */
describe('FindRoleByIdQueryHandler', () => {
  let handler: FindRoleByIdQueryHandler;
  let repository: RoleReadRepoPort;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRepository: RoleReadRepoPort = {
      getRoleById: jest.fn(),
      getRolesByDomain: jest.fn(),
      getRolesByCodes: jest.fn(),
      getRoleByCode: jest.fn(),
      getRoleCodesByUserId: jest.fn(),
      pageRoles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindRoleByIdQueryHandler,
        {
          provide: RoleReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<FindRoleByIdQueryHandler>(FindRoleByIdQueryHandler);
    repository = module.get<RoleReadRepoPort>(RoleReadRepoPortToken);
  });

  /**
   * 应该成功查询存在的角色
   *
   * 验证当角色存在时，处理器能够正确返回角色信息。
   */
  it('应该成功查询存在的角色', async () => {
    const roleId = 'role-123';
    const mockRole: RoleProperties = {
      id: roleId,
      code: 'admin',
      name: '管理员',
      status: 'ENABLED',
      domain: 'example.com',
      createdAt: new Date(),
      createdBy: 'user-1',
    };

    (repository.getRoleById as jest.Mock).mockResolvedValue(mockRole);

    const query = new FindRoleByIdQuery(roleId);
    const result = await handler.execute(query);

    expect(result).toEqual(mockRole);
    expect(repository.getRoleById).toHaveBeenCalledWith(roleId);
    expect(repository.getRoleById).toHaveBeenCalledTimes(1);
  });

  /**
   * 应该返回 null 当角色不存在时
   *
   * 验证当角色不存在时，处理器返回 null。
   */
  it('应该返回 null 当角色不存在时', async () => {
    const roleId = 'non-existent-role';

    (repository.getRoleById as jest.Mock).mockResolvedValue(null);

    const query = new FindRoleByIdQuery(roleId);
    const result = await handler.execute(query);

    expect(result).toBeNull();
    expect(repository.getRoleById).toHaveBeenCalledWith(roleId);
    expect(repository.getRoleById).toHaveBeenCalledTimes(1);
  });

  /**
   * 应该正确处理查询异常
   *
   * 验证当仓储抛出异常时，处理器能够正确传播异常。
   */
  it('应该正确处理查询异常', async () => {
    const roleId = 'role-123';
    const error = new Error('数据库连接失败');

    (repository.getRoleById as jest.Mock).mockRejectedValue(error);

    const query = new FindRoleByIdQuery(roleId);

    await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
    expect(repository.getRoleById).toHaveBeenCalledWith(roleId);
  });

  /**
   * 应该使用正确的查询参数
   *
   * 验证处理器使用查询对象中的正确 ID。
   */
  it('应该使用正确的查询参数', async () => {
    const roleId = 'role-456';
    const mockRole: RoleProperties = {
      id: roleId,
      code: 'user',
      name: '普通用户',
      status: 'ENABLED',
      domain: 'example.com',
      createdAt: new Date(),
      createdBy: 'user-1',
    };

    (repository.getRoleById as jest.Mock).mockResolvedValue(mockRole);

    const query = new FindRoleByIdQuery(roleId);
    await handler.execute(query);

    expect(repository.getRoleById).toHaveBeenCalledWith(roleId);
    expect(repository.getRoleById).not.toHaveBeenCalledWith('wrong-id');
  });
});

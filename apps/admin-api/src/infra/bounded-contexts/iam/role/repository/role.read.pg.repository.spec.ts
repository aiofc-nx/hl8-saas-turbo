import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import type { RoleProperties } from '@/lib/bounded-contexts/iam/role/domain/role.read.model';
import { PageRolesQuery } from '@/lib/bounded-contexts/iam/role/queries/page-roles.query';
import { Status } from '@/lib/shared/enums/status.enum';

import { PaginationResult } from '@hl8/rest';

import { RoleReadPostgresRepository } from './role.read.pg.repository';

/**
 * RoleReadPostgresRepository 单元测试
 *
 * @description
 * 测试角色读取仓储的实现，验证根据用户 ID 查找角色、分页查询、按代码查询和按 ID 查询的功能。
 */
describe('RoleReadPostgresRepository', () => {
  let repository: RoleReadPostgresRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleReadPostgresRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<RoleReadPostgresRepository>(
      RoleReadPostgresRepository,
    );
    entityManager = module.get(EntityManager);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findRolesByUserId', () => {
    /**
     * 应该成功根据用户 ID 查找角色代码集合
     *
     * 验证当用户存在角色关联时，能够正确返回角色代码集合。
     */
    it('应该成功根据用户 ID 查找角色代码集合', async () => {
      const userId = 'user-123';

      // Mock 用户角色关联数据
      const mockUserRoles = [{ roleId: 'role-1' }, { roleId: 'role-2' }];

      // Mock 角色数据
      const mockRoles = [{ code: 'admin' }, { code: 'user' }];

      (entityManager.find as jest.Mock)
        .mockResolvedValueOnce(mockUserRoles) // 第一次调用：查询用户角色关联
        .mockResolvedValueOnce(mockRoles); // 第二次调用：查询角色

      const result = await repository.findRolesByUserId(userId);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(2);
      expect(result.has('admin')).toBe(true);
      expect(result.has('user')).toBe(true);

      // 验证第一次查询：查询用户角色关联
      expect(entityManager.find).toHaveBeenNthCalledWith(
        1,
        'SysUserRole',
        { userId },
        { fields: ['roleId'] },
      );

      // 验证第二次查询：根据角色 ID 查询角色
      expect(entityManager.find).toHaveBeenNthCalledWith(
        2,
        'SysRole',
        { id: { $in: ['role-1', 'role-2'] } },
        { fields: ['code'] },
      );
    });

    /**
     * 应该返回空集合当用户没有角色关联时
     *
     * 验证当用户不存在任何角色关联时，方法返回空集合。
     */
    it('应该返回空集合当用户没有角色关联时', async () => {
      const userId = 'user-without-roles';

      (entityManager.find as jest.Mock).mockResolvedValueOnce([]);

      const result = await repository.findRolesByUserId(userId);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
      expect(entityManager.find).toHaveBeenCalledTimes(1);
      expect(entityManager.find).toHaveBeenCalledWith(
        'SysUserRole',
        { userId },
        { fields: ['roleId'] },
      );
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当数据库查询抛出异常时，方法能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const userId = 'user-123';
      const error = new Error('数据库连接失败');

      (entityManager.find as jest.Mock).mockRejectedValue(error);

      await expect(repository.findRolesByUserId(userId)).rejects.toThrow(
        '数据库连接失败',
      );
    });
  });

  describe('pageRoles', () => {
    /**
     * 应该成功分页查询角色（无筛选条件）
     *
     * 验证当没有筛选条件时，能够正确返回分页结果。
     */
    it('应该成功分页查询角色（无筛选条件）', async () => {
      const query = new PageRolesQuery({
        current: 1,
        size: 10,
      });

      const mockRoles: RoleProperties[] = [
        {
          id: 'role-1',
          code: 'admin',
          name: '管理员',
          pid: '0',
          status: Status.ENABLED,
          description: '管理员角色',
        } as RoleProperties,
        {
          id: 'role-2',
          code: 'user',
          name: '普通用户',
          pid: '0',
          status: Status.ENABLED,
          description: '普通用户角色',
        } as RoleProperties,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockRoles,
        2,
      ]);

      const result = await repository.pageRoles(query);

      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.current).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(2);
      expect(result.records).toEqual(mockRoles);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysRole',
        {},
        {
          limit: 10,
          offset: 0,
        },
      );
    });

    /**
     * 应该成功分页查询角色（按代码筛选）
     *
     * 验证当提供代码筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询角色（按代码筛选）', async () => {
      const query = new PageRolesQuery({
        current: 1,
        size: 10,
        code: 'admin',
      });

      const mockRoles: RoleProperties[] = [
        {
          id: 'role-1',
          code: 'admin',
          name: '管理员',
          pid: '0',
          status: Status.ENABLED,
          description: '管理员角色',
        } as RoleProperties,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockRoles,
        1,
      ]);

      const result = await repository.pageRoles(query);

      expect(result.total).toBe(1);
      expect(result.records).toEqual(mockRoles);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysRole',
        { code: { $like: '%admin%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询角色（按名称筛选）
     *
     * 验证当提供名称筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询角色（按名称筛选）', async () => {
      const query = new PageRolesQuery({
        current: 1,
        size: 10,
        name: '管理',
      });

      const mockRoles: RoleProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockRoles,
        0,
      ]);

      const result = await repository.pageRoles(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysRole',
        { name: { $like: '%管理%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询角色（按状态筛选）
     *
     * 验证当提供状态筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询角色（按状态筛选）', async () => {
      const query = new PageRolesQuery({
        current: 1,
        size: 10,
        status: Status.DISABLED,
      });

      const mockRoles: RoleProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockRoles,
        0,
      ]);

      const result = await repository.pageRoles(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysRole',
        { status: Status.DISABLED },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询角色（同时按代码、名称和状态筛选）
     *
     * 验证当同时提供多个筛选条件时，能够正确构建复合查询条件。
     */
    it('应该成功分页查询角色（同时按代码、名称和状态筛选）', async () => {
      const query = new PageRolesQuery({
        current: 2,
        size: 5,
        code: 'admin',
        name: '管理',
        status: Status.ENABLED,
      });

      const mockRoles: RoleProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockRoles,
        0,
      ]);

      const result = await repository.pageRoles(query);

      expect(result.current).toBe(2);
      expect(result.size).toBe(5);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysRole',
        {
          code: { $like: '%admin%' },
          name: { $like: '%管理%' },
          status: Status.ENABLED,
        },
        expect.objectContaining({
          limit: 5,
          offset: 5, // (2 - 1) * 5
        }),
      );
    });
  });

  describe('getRoleByCode', () => {
    /**
     * 应该成功根据代码获取角色
     *
     * 验证当角色存在时，能够正确返回角色属性。
     */
    it('应该成功根据代码获取角色', async () => {
      const roleCode = 'admin';
      const mockRole: RoleProperties = {
        id: 'role-1',
        code: roleCode,
        name: '管理员',
        pid: '0',
        status: Status.ENABLED,
        description: '管理员角色',
      } as RoleProperties;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockRole);

      const result = await repository.getRoleByCode(roleCode);

      expect(result).toEqual(mockRole);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysRole', {
        code: roleCode,
      });
      expect(entityManager.findOne).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回 null 当角色不存在时
     *
     * 验证当角色不存在时，方法返回 null。
     */
    it('应该返回 null 当角色不存在时', async () => {
      const roleCode = 'non-existent-role';

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.getRoleByCode(roleCode);

      expect(result).toBeNull();
      expect(entityManager.findOne).toHaveBeenCalledWith('SysRole', {
        code: roleCode,
      });
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当数据库查询抛出异常时，方法能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const roleCode = 'admin';
      const error = new Error('数据库连接失败');

      (entityManager.findOne as jest.Mock).mockRejectedValue(error);

      await expect(repository.getRoleByCode(roleCode)).rejects.toThrow(
        '数据库连接失败',
      );
    });
  });

  describe('getRoleById', () => {
    /**
     * 应该成功根据 ID 获取角色
     *
     * 验证当角色存在时，能够正确返回角色属性。
     */
    it('应该成功根据 ID 获取角色', async () => {
      const roleId = 'role-123';
      const mockRole: RoleProperties = {
        id: roleId,
        code: 'admin',
        name: '管理员',
        pid: '0',
        status: Status.ENABLED,
        description: '管理员角色',
      } as RoleProperties;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockRole);

      const result = await repository.getRoleById(roleId);

      expect(result).toEqual(mockRole);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysRole', {
        id: roleId,
      });
      expect(entityManager.findOne).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回 null 当角色不存在时
     *
     * 验证当角色不存在时，方法返回 null。
     */
    it('应该返回 null 当角色不存在时', async () => {
      const roleId = 'non-existent-role';

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.getRoleById(roleId);

      expect(result).toBeNull();
      expect(entityManager.findOne).toHaveBeenCalledWith('SysRole', {
        id: roleId,
      });
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当数据库查询抛出异常时，方法能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const roleId = 'role-123';
      const error = new Error('数据库连接失败');

      (entityManager.findOne as jest.Mock).mockRejectedValue(error);

      await expect(repository.getRoleById(roleId)).rejects.toThrow(
        '数据库连接失败',
      );
    });
  });
});

import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import type { UserProperties } from '@/lib/bounded-contexts/iam/authentication/domain/user.read.model';
import { PageUsersQuery } from '@/lib/bounded-contexts/iam/authentication/queries/page-users.query';
import { Status } from '@/lib/shared/enums/status.enum';

import { PaginationResult } from '@hl8/rest';

import { UserReadRepository } from './user.read.pg.repository';

/**
 * UserReadRepository 单元测试
 *
 * @description
 * 测试用户读取仓储的实现，验证用户查询、分页查询、角色关联查询等功能。
 */
describe('UserReadRepository', () => {
  let repository: UserReadRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserReadRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<UserReadRepository>(UserReadRepository);
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

  describe('findUserById', () => {
    /**
     * 应该成功根据 ID 查找用户
     *
     * 验证当用户存在时，能够正确返回用户属性。
     */
    it('应该成功根据 ID 查找用户', async () => {
      const userId = 'user-123';
      const mockUser: UserProperties = {
        id: userId,
        username: 'testuser',
        domain: 'example.com',
        nickName: '测试用户',
        status: Status.ENABLED,
        password: 'hashed-password',
        avatar: null,
        email: 'test@example.com',
        phoneNumber: '13800138000',
        isEmailVerified: true,
        createdAt: new Date(),
        createdBy: 'system',
      } as UserProperties;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.findUserById(userId);

      expect(result).toEqual(mockUser);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysUser', {
        id: userId,
      });
      expect(entityManager.findOne).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回 null 当用户不存在时
     *
     * 验证当用户不存在时，方法返回 null。
     */
    it('应该返回 null 当用户不存在时', async () => {
      const userId = 'non-existent-user';

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findUserById(userId);

      expect(result).toBeNull();
      expect(entityManager.findOne).toHaveBeenCalledWith('SysUser', {
        id: userId,
      });
    });
  });

  describe('findUserIdsByRoleId', () => {
    /**
     * 应该成功根据角色 ID 查找用户 ID 列表
     *
     * 验证当角色存在用户关联时，能够正确返回用户 ID 数组。
     */
    it('应该成功根据角色 ID 查找用户 ID 列表', async () => {
      const roleId = 'role-123';
      const mockUserRoles = [
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockUserRoles);

      const result = await repository.findUserIdsByRoleId(roleId);

      expect(result).toEqual(['user-1', 'user-2', 'user-3']);
      expect(result).toHaveLength(3);
      expect(entityManager.find).toHaveBeenCalledWith('SysUserRole', {
        roleId,
      });
    });

    /**
     * 应该返回空数组当角色没有用户关联时
     *
     * 验证当角色不存在任何用户关联时，方法返回空数组。
     */
    it('应该返回空数组当角色没有用户关联时', async () => {
      const roleId = 'role-without-users';

      (entityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.findUserIdsByRoleId(roleId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(entityManager.find).toHaveBeenCalledWith('SysUserRole', {
        roleId,
      });
    });
  });

  describe('findUsersByIds', () => {
    /**
     * 应该成功根据 ID 列表查找用户
     *
     * 验证当用户存在时，能够正确返回用户属性数组。
     */
    it('应该成功根据 ID 列表查找用户', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const mockUsers: UserProperties[] = [
        {
          id: 'user-1',
          username: 'user1',
          domain: 'example.com',
          nickName: '用户1',
          status: Status.ENABLED,
          password: 'hashed-password',
          avatar: null,
          email: 'user1@example.com',
          phoneNumber: null,
          isEmailVerified: true,
          createdAt: new Date(),
          createdBy: 'system',
        } as UserProperties,
        {
          id: 'user-2',
          username: 'user2',
          domain: 'example.com',
          nickName: '用户2',
          status: Status.ENABLED,
          password: 'hashed-password',
          avatar: null,
          email: 'user2@example.com',
          phoneNumber: null,
          isEmailVerified: false,
          createdAt: new Date(),
          createdBy: 'system',
        } as UserProperties,
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockUsers);

      const result = await repository.findUsersByIds(userIds);

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
      expect(entityManager.find).toHaveBeenCalledWith('SysUser', {
        id: { $in: userIds },
      });
    });

    /**
     * 应该返回空数组当用户不存在时
     *
     * 验证当用户不存在时，方法返回空数组。
     */
    it('应该返回空数组当用户不存在时', async () => {
      const userIds = ['non-existent-1', 'non-existent-2'];

      (entityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.findUsersByIds(userIds);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findUserByIdentifier', () => {
    /**
     * 应该成功根据用户名查找用户
     *
     * 验证当使用用户名作为标识符时，能够正确返回用户属性。
     */
    it('应该成功根据用户名查找用户', async () => {
      const identifier = 'testuser';
      const mockUser: UserProperties = {
        id: 'user-123',
        username: identifier,
        domain: 'example.com',
        nickName: '测试用户',
        status: Status.ENABLED,
        password: 'hashed-password',
        avatar: null,
        email: 'test@example.com',
        phoneNumber: null,
        isEmailVerified: true,
        createdAt: new Date(),
        createdBy: 'system',
      } as UserProperties;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.findUserByIdentifier(identifier);

      expect(result).toEqual(mockUser);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysUser', {
        $or: [
          { username: identifier },
          { email: identifier },
          { phoneNumber: identifier },
        ],
      });
    });

    /**
     * 应该成功根据邮箱查找用户
     *
     * 验证当使用邮箱作为标识符时，能够正确返回用户属性。
     */
    it('应该成功根据邮箱查找用户', async () => {
      const identifier = 'test@example.com';
      const mockUser: UserProperties = {
        id: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        nickName: '测试用户',
        status: Status.ENABLED,
        password: 'hashed-password',
        avatar: null,
        email: identifier,
        phoneNumber: null,
        isEmailVerified: true,
        createdAt: new Date(),
        createdBy: 'system',
      } as UserProperties;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.findUserByIdentifier(identifier);

      expect(result).toEqual(mockUser);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysUser', {
        $or: [
          { username: identifier },
          { email: identifier },
          { phoneNumber: identifier },
        ],
      });
    });

    /**
     * 应该成功根据手机号查找用户
     *
     * 验证当使用手机号作为标识符时，能够正确返回用户属性。
     */
    it('应该成功根据手机号查找用户', async () => {
      const identifier = '13800138000';
      const mockUser: UserProperties = {
        id: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        nickName: '测试用户',
        status: Status.ENABLED,
        password: 'hashed-password',
        avatar: null,
        email: 'test@example.com',
        phoneNumber: identifier,
        isEmailVerified: true,
        createdAt: new Date(),
        createdBy: 'system',
      } as UserProperties;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.findUserByIdentifier(identifier);

      expect(result).toEqual(mockUser);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysUser', {
        $or: [
          { username: identifier },
          { email: identifier },
          { phoneNumber: identifier },
        ],
      });
    });

    /**
     * 应该返回 null 当用户不存在时
     *
     * 验证当用户不存在时，方法返回 null。
     */
    it('应该返回 null 当用户不存在时', async () => {
      const identifier = 'non-existent-identifier';

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findUserByIdentifier(identifier);

      expect(result).toBeNull();
    });
  });

  describe('pageUsers', () => {
    /**
     * 应该成功分页查询用户（无筛选条件）
     *
     * 验证当没有筛选条件时，能够正确返回分页结果。
     */
    it('应该成功分页查询用户（无筛选条件）', async () => {
      const query = new PageUsersQuery({
        current: 1,
        size: 10,
      });

      const mockUsers: UserProperties[] = [
        {
          id: 'user-1',
          username: 'user1',
          domain: 'example.com',
          nickName: '用户1',
          status: Status.ENABLED,
          password: 'hashed-password',
          avatar: null,
          email: 'user1@example.com',
          phoneNumber: null,
          isEmailVerified: true,
          createdAt: new Date(),
          createdBy: 'system',
        } as UserProperties,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockUsers,
        1,
      ]);

      const result = await repository.pageUsers(query);

      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.current).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(1);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysUser',
        {},
        expect.objectContaining({
          limit: 10,
          offset: 0,
          fields: expect.arrayContaining([
            'id',
            'username',
            'domain',
            'avatar',
            'email',
            'phoneNumber',
            'nickName',
            'status',
            'createdAt',
            'createdBy',
            'updatedAt',
            'updatedBy',
          ]),
        }),
      );
    });

    /**
     * 应该成功分页查询用户（按用户名筛选）
     *
     * 验证当提供用户名筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询用户（按用户名筛选）', async () => {
      const query = new PageUsersQuery({
        current: 1,
        size: 10,
        username: 'test',
      });

      const mockUsers: UserProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockUsers,
        0,
      ]);

      const result = await repository.pageUsers(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysUser',
        { username: { $like: '%test%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询用户（按昵称筛选）
     *
     * 验证当提供昵称筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询用户（按昵称筛选）', async () => {
      const query = new PageUsersQuery({
        current: 1,
        size: 10,
        nickName: '测试',
      });

      const mockUsers: UserProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockUsers,
        0,
      ]);

      const result = await repository.pageUsers(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysUser',
        { nickName: { $like: '%测试%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询用户（按状态筛选）
     *
     * 验证当提供状态筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询用户（按状态筛选）', async () => {
      const query = new PageUsersQuery({
        current: 1,
        size: 10,
        status: Status.DISABLED,
      });

      const mockUsers: UserProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockUsers,
        0,
      ]);

      const result = await repository.pageUsers(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysUser',
        { status: Status.DISABLED },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });
  });

  describe('getUserByUsername', () => {
    /**
     * 应该成功根据用户名获取用户
     *
     * 验证当用户存在时，能够正确返回用户属性。
     */
    it('应该成功根据用户名获取用户', async () => {
      const username = 'testuser';
      const mockUser: UserProperties = {
        id: 'user-123',
        username: username,
        domain: 'example.com',
        nickName: '测试用户',
        status: Status.ENABLED,
        password: 'hashed-password',
        avatar: null,
        email: 'test@example.com',
        phoneNumber: null,
        isEmailVerified: true,
        createdAt: new Date(),
        createdBy: 'system',
      } as UserProperties;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.getUserByUsername(username);

      expect(result).toEqual(mockUser);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysUser', {
        username,
      });
    });

    /**
     * 应该返回 null 当用户不存在时
     *
     * 验证当用户不存在时，方法返回 null。
     */
    it('应该返回 null 当用户不存在时', async () => {
      const username = 'non-existent-user';

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.getUserByUsername(username);

      expect(result).toBeNull();
    });
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
      expect(entityManager.find).toHaveBeenNthCalledWith(1, 'SysUserRole', {
        userId,
      });

      // 验证第二次查询：根据角色 ID 查询角色
      expect(entityManager.find).toHaveBeenNthCalledWith(2, 'SysRole', {
        id: { $in: ['role-1', 'role-2'] },
      });
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
    });
  });
});

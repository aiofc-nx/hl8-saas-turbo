import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { Password } from '@/lib/bounded-contexts/iam/authentication/domain/password.value-object';
import { User } from '@/lib/bounded-contexts/iam/authentication/domain/user';
import { Status } from '@/lib/shared/enums/status.enum';

import { UserWriteRepository } from './user.write.pg.repository';

/**
 * UserWriteRepository 单元测试
 *
 * @description
 * 测试用户写入仓储的实现，验证保存、更新和删除用户的功能，包括事务处理。
 */
describe('UserWriteRepository', () => {
  let repository: UserWriteRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      create: jest.fn(),
      persistAndFlush: jest.fn(),
      nativeDelete: jest.fn(),
      nativeUpdate: jest.fn(),
      transactional: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserWriteRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<UserWriteRepository>(UserWriteRepository);
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

  describe('save', () => {
    /**
     * 应该成功保存用户
     *
     * 验证能够正确创建并持久化用户，密码从值对象中提取。
     */
    it('应该成功保存用户', async () => {
      const hashedPassword = await Password.hash('password123');
      const user = new User({
        id: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        nickName: '测试用户',
        password: hashedPassword.getValue(),
        status: Status.ENABLED,
        avatar: null,
        email: 'test@example.com',
        phoneNumber: '13800138000',
        isEmailVerified: true,
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const mockUserEntity = {
        id: 'user-123',
        ...user,
        password: hashedPassword.getValue(),
      };

      (entityManager.create as jest.Mock).mockReturnValue(mockUserEntity);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      await repository.save(user);

      expect(entityManager.create).toHaveBeenCalledWith(
        'SysUser',
        expect.objectContaining({
          username: 'testuser',
          domain: 'example.com',
          nickName: '测试用户',
          password: hashedPassword.getValue(),
        }),
      );
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(
        mockUserEntity,
      );
    });

    /**
     * 应该正确处理保存异常
     *
     * 验证当保存操作失败时，能够正确传播异常。
     */
    it('应该正确处理保存异常', async () => {
      const hashedPassword = await Password.hash('password123');
      const user = new User({
        id: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        nickName: '测试用户',
        password: hashedPassword.getValue(),
        status: Status.ENABLED,
        avatar: null,
        email: null,
        phoneNumber: null,
        isEmailVerified: false,
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const error = new Error('数据库保存失败');
      (entityManager.create as jest.Mock).mockReturnValue({});
      (entityManager.persistAndFlush as jest.Mock).mockRejectedValue(error);

      await expect(repository.save(user)).rejects.toThrow('数据库保存失败');
    });
  });

  describe('update', () => {
    /**
     * 应该成功更新用户
     *
     * 验证能够正确更新用户的信息，只更新允许修改的字段。
     */
    it('应该成功更新用户', async () => {
      const user = new User({
        id: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        nickName: '更新后的昵称',
        password: 'hashed-password',
        status: Status.DISABLED,
        avatar: 'https://example.com/avatar.jpg',
        email: 'updated@example.com',
        phoneNumber: '13900139000',
        isEmailVerified: true,
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      (entityManager.nativeUpdate as jest.Mock).mockResolvedValue(1);

      await repository.update(user);

      expect(entityManager.nativeUpdate).toHaveBeenCalledWith(
        'SysUser',
        { id: user.id },
        {
          nickName: user.nickName,
          status: user.status,
          avatar: user.avatar,
          email: user.email,
          phoneNumber: user.phoneNumber,
          isEmailVerified: user.isEmailVerified,
          updatedAt: user.createdAt,
          updatedBy: user.createdBy,
        },
      );
      // 验证不包含密码和域字段
      expect(entityManager.nativeUpdate).not.toHaveBeenCalledWith(
        'SysUser',
        { id: user.id },
        expect.objectContaining({
          password: expect.anything(),
          domain: expect.anything(),
        }),
      );
    });

    /**
     * 应该正确处理更新异常
     *
     * 验证当更新操作失败时，能够正确传播异常。
     */
    it('应该正确处理更新异常', async () => {
      const user = new User({
        id: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        nickName: '测试用户',
        password: 'hashed-password',
        status: Status.ENABLED,
        avatar: null,
        email: null,
        phoneNumber: null,
        isEmailVerified: false,
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const error = new Error('数据库更新失败');
      (entityManager.nativeUpdate as jest.Mock).mockRejectedValue(error);

      await expect(repository.update(user)).rejects.toThrow('数据库更新失败');
    });
  });

  describe('deleteById', () => {
    /**
     * 应该成功根据 ID 删除用户
     *
     * 验证能够正确删除指定 ID 的用户。
     */
    it('应该成功根据 ID 删除用户', async () => {
      const userId = 'user-123';

      (entityManager.nativeDelete as jest.Mock).mockResolvedValue(1);

      await repository.deleteById(userId);

      expect(entityManager.nativeDelete).toHaveBeenCalledWith('SysUser', {
        id: userId,
      });
      expect(entityManager.nativeDelete).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理删除异常
     *
     * 验证当删除操作失败时，能够正确传播异常。
     */
    it('应该正确处理删除异常', async () => {
      const userId = 'user-123';
      const error = new Error('数据库删除失败');

      (entityManager.nativeDelete as jest.Mock).mockRejectedValue(error);

      await expect(repository.deleteById(userId)).rejects.toThrow(
        '数据库删除失败',
      );
    });
  });

  describe('deleteUserRoleByRoleId', () => {
    /**
     * 应该成功根据角色 ID 删除用户角色关联
     *
     * 验证能够正确删除指定角色的所有用户角色关联。
     */
    it('应该成功根据角色 ID 删除用户角色关联', async () => {
      const roleId = 'role-123';

      (entityManager.nativeDelete as jest.Mock).mockResolvedValue(5);

      await repository.deleteUserRoleByRoleId(roleId);

      expect(entityManager.nativeDelete).toHaveBeenCalledWith('SysUserRole', {
        roleId,
      });
    });
  });

  describe('deleteUserRoleByUserId', () => {
    /**
     * 应该成功根据用户 ID 删除用户角色关联
     *
     * 验证能够正确删除指定用户的所有角色关联。
     */
    it('应该成功根据用户 ID 删除用户角色关联', async () => {
      const userId = 'user-123';

      (entityManager.nativeDelete as jest.Mock).mockResolvedValue(3);

      await repository.deleteUserRoleByUserId(userId);

      expect(entityManager.nativeDelete).toHaveBeenCalledWith('SysUserRole', {
        userId,
      });
    });
  });

  describe('deleteUserRoleByDomain', () => {
    /**
     * 应该成功根据域名删除用户和用户角色关联
     *
     * 验证能够正确删除指定域下的所有用户及其用户角色关联，使用事务确保数据一致性。
     */
    it('应该成功根据域名删除用户和用户角色关联', async () => {
      const domain = 'example.com';
      const mockUsers = [{ id: 'user-1' }, { id: 'user-2' }, { id: 'user-3' }];

      const mockEm = {
        find: jest.fn().mockResolvedValue(mockUsers),
        nativeDelete: jest.fn().mockResolvedValue(1),
      };

      (entityManager.transactional as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockEm);
        },
      );

      await repository.deleteUserRoleByDomain(domain);

      expect(entityManager.transactional).toHaveBeenCalledTimes(1);
      expect(mockEm.find).toHaveBeenCalledWith(
        'SysUser',
        { domain },
        {
          fields: ['id'],
        },
      );
      expect(mockEm.nativeDelete).toHaveBeenCalledWith('SysUser', {
        id: { $in: ['user-1', 'user-2', 'user-3'] },
      });
      expect(mockEm.nativeDelete).toHaveBeenCalledWith('SysUserRole', {
        userId: { $in: ['user-1', 'user-2', 'user-3'] },
      });
    });

    /**
     * 应该正确处理空用户列表
     *
     * 验证当域下没有用户时，能够正确返回而不执行删除操作。
     */
    it('应该正确处理空用户列表', async () => {
      const domain = 'empty-domain.com';

      const mockEm = {
        find: jest.fn().mockResolvedValue([]),
        nativeDelete: jest.fn(),
      };

      (entityManager.transactional as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockEm);
        },
      );

      await repository.deleteUserRoleByDomain(domain);

      expect(mockEm.find).toHaveBeenCalledWith(
        'SysUser',
        { domain },
        {
          fields: ['id'],
        },
      );
      expect(mockEm.nativeDelete).not.toHaveBeenCalled();
    });

    /**
     * 应该正确处理事务异常
     *
     * 验证当事务执行失败时，能够正确传播异常。
     */
    it('应该正确处理事务异常', async () => {
      const domain = 'example.com';
      const error = new Error('事务执行失败');

      (entityManager.transactional as jest.Mock).mockRejectedValue(error);

      await expect(repository.deleteUserRoleByDomain(domain)).rejects.toThrow(
        '事务执行失败',
      );
    });
  });
});

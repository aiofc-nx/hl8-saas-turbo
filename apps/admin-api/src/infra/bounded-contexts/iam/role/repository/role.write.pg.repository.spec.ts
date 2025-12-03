import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { Role } from '@/lib/bounded-contexts/iam/role/domain/role.model';
import { Status } from '@/lib/shared/enums/status.enum';

import { RoleWritePostgresRepository } from './role.write.pg.repository';

/**
 * RoleWritePostgresRepository 单元测试
 *
 * @description
 * 测试角色写入仓储的实现，验证保存、更新和删除角色的功能。
 */
describe('RoleWritePostgresRepository', () => {
  let repository: RoleWritePostgresRepository;
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
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleWritePostgresRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<RoleWritePostgresRepository>(
      RoleWritePostgresRepository,
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

  describe('save', () => {
    /**
     * 应该成功保存角色
     *
     * 验证能够正确创建并持久化角色。
     */
    it('应该成功保存角色', async () => {
      const role = Role.fromCreate({
        code: 'admin',
        name: '管理员',
        pid: '0',
        status: Status.ENABLED,
        description: '管理员角色',
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const mockRoleEntity = {
        id: 'role-123',
        ...role,
      };

      (entityManager.create as jest.Mock).mockReturnValue(mockRoleEntity);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      await repository.save(role);

      expect(entityManager.create).toHaveBeenCalledWith(
        'SysRole',
        expect.objectContaining({
          code: 'admin',
          name: '管理员',
          pid: '0',
          status: Status.ENABLED,
        }),
      );
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(
        mockRoleEntity,
      );
    });

    /**
     * 应该正确处理保存异常
     *
     * 验证当保存操作失败时，能够正确传播异常。
     */
    it('应该正确处理保存异常', async () => {
      const role = Role.fromCreate({
        code: 'admin',
        name: '管理员',
        pid: '0',
        status: Status.ENABLED,
        description: '管理员角色',
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const error = new Error('数据库保存失败');
      (entityManager.create as jest.Mock).mockReturnValue({});
      (entityManager.persistAndFlush as jest.Mock).mockRejectedValue(error);

      await expect(repository.save(role)).rejects.toThrow('数据库保存失败');
    });
  });

  describe('update', () => {
    /**
     * 应该成功更新角色
     *
     * 验证能够正确更新角色的信息。
     */
    it('应该成功更新角色', async () => {
      const role = Role.fromUpdate({
        id: 'role-123',
        code: 'admin',
        name: '管理员',
        pid: '0',
        status: Status.ENABLED,
        description: '更新后的描述',
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-2',
      });

      (entityManager.nativeUpdate as jest.Mock).mockResolvedValue(1);

      await repository.update(role);

      expect(entityManager.nativeUpdate).toHaveBeenCalledWith(
        'SysRole',
        { id: role.id },
        expect.objectContaining({
          code: 'admin',
          name: '管理员',
        }),
      );
    });

    /**
     * 应该正确处理更新异常
     *
     * 验证当更新操作失败时，能够正确传播异常。
     */
    it('应该正确处理更新异常', async () => {
      const role = Role.fromUpdate({
        id: 'role-123',
        code: 'admin',
        name: '管理员',
        pid: '0',
        status: Status.ENABLED,
        description: '管理员角色',
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-2',
      });

      const error = new Error('数据库更新失败');
      (entityManager.nativeUpdate as jest.Mock).mockRejectedValue(error);

      await expect(repository.update(role)).rejects.toThrow('数据库更新失败');
    });
  });

  describe('deleteById', () => {
    /**
     * 应该成功根据 ID 删除角色
     *
     * 验证能够正确删除指定 ID 的角色。
     */
    it('应该成功根据 ID 删除角色', async () => {
      const roleId = 'role-123';

      (entityManager.nativeDelete as jest.Mock).mockResolvedValue(1);

      await repository.deleteById(roleId);

      expect(entityManager.nativeDelete).toHaveBeenCalledWith('SysRole', {
        id: roleId,
      });
      expect(entityManager.nativeDelete).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理删除异常
     *
     * 验证当删除操作失败时，能够正确传播异常。
     */
    it('应该正确处理删除异常', async () => {
      const roleId = 'role-123';
      const error = new Error('数据库删除失败');

      (entityManager.nativeDelete as jest.Mock).mockRejectedValue(error);

      await expect(repository.deleteById(roleId)).rejects.toThrow(
        '数据库删除失败',
      );
    });
  });

  describe('deleteRoleMenuByRoleId', () => {
    /**
     * 应该成功根据角色 ID 删除角色菜单关联
     *
     * 验证能够正确删除指定角色的所有菜单关联。
     */
    it('应该成功根据角色 ID 删除角色菜单关联', async () => {
      const roleId = 'role-123';

      (entityManager.nativeDelete as jest.Mock).mockResolvedValue(3);

      await repository.deleteRoleMenuByRoleId(roleId);

      expect(entityManager.nativeDelete).toHaveBeenCalledWith('SysRoleMenu', {
        roleId,
      });
    });
  });

  describe('deleteRoleMenuByDomain', () => {
    /**
     * 应该成功根据域名删除角色菜单关联
     *
     * 验证能够正确删除指定域的所有角色菜单关联。
     */
    it('应该成功根据域名删除角色菜单关联', async () => {
      const domain = 'example.com';

      (entityManager.nativeDelete as jest.Mock).mockResolvedValue(5);

      await repository.deleteRoleMenuByDomain(domain);

      expect(entityManager.nativeDelete).toHaveBeenCalledWith('SysRoleMenu', {
        domain,
      });
    });
  });
});

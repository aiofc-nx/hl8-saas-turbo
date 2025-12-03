import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { Menu } from '@/lib/bounded-contexts/iam/menu/domain/menu.model';
import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { MenuWritePostgresRepository } from './menu.write.pg.repository';

/**
 * MenuWritePostgresRepository 单元测试
 *
 * @description
 * 测试菜单写入仓储的实现，验证保存、更新和删除菜单的功能。
 */
describe('MenuWritePostgresRepository', () => {
  let repository: MenuWritePostgresRepository;
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
        MenuWritePostgresRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<MenuWritePostgresRepository>(
      MenuWritePostgresRepository,
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
     * 应该成功保存菜单
     *
     * 验证能够正确创建并持久化菜单，移除 id 字段让数据库自动生成。
     */
    it('应该成功保存菜单', async () => {
      const menu = Menu.fromCreate({
        id: 0, // 临时 ID，保存时会被移除
        menuName: '用户管理',
        menuType: MenuType.MENU,
        routeName: 'user-management',
        routePath: '/user-management',
        component: 'UserManagement',
        status: Status.ENABLED,
        pid: 0,
        order: 1,
        constant: false,
        iconType: null,
        icon: null,
        pathParam: null,
        activeMenu: null,
        hideInMenu: null,
        i18nKey: null,
        keepAlive: null,
        href: null,
        multiTab: null,
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const mockMenuEntity = {
        ...menu,
        id: 1, // 数据库生成的 ID
      };

      (entityManager.create as jest.Mock).mockReturnValue(mockMenuEntity);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      await repository.save(menu);

      expect(entityManager.create).toHaveBeenCalledWith(
        'SysMenu',
        expect.not.objectContaining({ id: expect.anything() }),
      );
      expect(entityManager.create).toHaveBeenCalledWith(
        'SysMenu',
        expect.objectContaining({
          menuName: '用户管理',
          menuType: MenuType.MENU,
          routeName: 'user-management',
        }),
      );
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(
        mockMenuEntity,
      );
    });

    /**
     * 应该正确处理保存异常
     *
     * 验证当保存操作失败时，能够正确传播异常。
     */
    it('应该正确处理保存异常', async () => {
      const menu = Menu.fromCreate({
        id: 0,
        menuName: '用户管理',
        menuType: MenuType.MENU,
        routeName: 'user-management',
        routePath: '/user-management',
        component: 'UserManagement',
        status: Status.ENABLED,
        pid: 0,
        order: 1,
        constant: false,
        iconType: null,
        icon: null,
        pathParam: null,
        activeMenu: null,
        hideInMenu: null,
        i18nKey: null,
        keepAlive: null,
        href: null,
        multiTab: null,
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const error = new Error('数据库保存失败');
      (entityManager.create as jest.Mock).mockReturnValue({});
      (entityManager.persistAndFlush as jest.Mock).mockRejectedValue(error);

      await expect(repository.save(menu)).rejects.toThrow('数据库保存失败');
    });
  });

  describe('update', () => {
    /**
     * 应该成功更新菜单
     *
     * 验证能够正确更新菜单的信息。
     */
    it('应该成功更新菜单', async () => {
      const menu = Menu.fromUpdate({
        id: 1,
        menuName: '更新后的菜单名',
        menuType: MenuType.MENU,
        routeName: 'user-management',
        routePath: '/user-management',
        component: 'UserManagement',
        status: Status.DISABLED,
        pid: 0,
        order: 2,
        constant: false,
        iconType: null,
        icon: null,
        pathParam: null,
        activeMenu: null,
        hideInMenu: null,
        i18nKey: null,
        keepAlive: null,
        href: null,
        multiTab: null,
        updatedAt: new Date(),
        updatedBy: 'user-2',
      });

      (entityManager.nativeUpdate as jest.Mock).mockResolvedValue(1);

      await repository.update(menu);

      expect(entityManager.nativeUpdate).toHaveBeenCalledWith(
        'SysMenu',
        { id: menu.id },
        expect.objectContaining({
          menuName: '更新后的菜单名',
          status: Status.DISABLED,
          order: 2,
        }),
      );
    });

    /**
     * 应该正确处理更新异常
     *
     * 验证当更新操作失败时，能够正确传播异常。
     */
    it('应该正确处理更新异常', async () => {
      const menu = Menu.fromUpdate({
        id: 1,
        menuName: '用户管理',
        menuType: MenuType.MENU,
        routeName: 'user-management',
        routePath: '/user-management',
        component: 'UserManagement',
        status: Status.ENABLED,
        pid: 0,
        order: 1,
        constant: false,
        iconType: null,
        icon: null,
        pathParam: null,
        activeMenu: null,
        hideInMenu: null,
        i18nKey: null,
        keepAlive: null,
        href: null,
        multiTab: null,
        updatedAt: new Date(),
        updatedBy: 'user-2',
      });

      const error = new Error('数据库更新失败');
      (entityManager.nativeUpdate as jest.Mock).mockRejectedValue(error);

      await expect(repository.update(menu)).rejects.toThrow('数据库更新失败');
    });
  });

  describe('deleteById', () => {
    /**
     * 应该成功根据 ID 删除菜单
     *
     * 验证能够正确删除指定 ID 的菜单。
     */
    it('应该成功根据 ID 删除菜单', async () => {
      const menuId = 1;

      (entityManager.nativeDelete as jest.Mock).mockResolvedValue(1);

      await repository.deleteById(menuId);

      expect(entityManager.nativeDelete).toHaveBeenCalledWith('SysMenu', {
        id: menuId,
      });
      expect(entityManager.nativeDelete).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理删除异常
     *
     * 验证当删除操作失败时，能够正确传播异常。
     */
    it('应该正确处理删除异常', async () => {
      const menuId = 1;
      const error = new Error('数据库删除失败');

      (entityManager.nativeDelete as jest.Mock).mockRejectedValue(error);

      await expect(repository.deleteById(menuId)).rejects.toThrow(
        '数据库删除失败',
      );
    });
  });
});

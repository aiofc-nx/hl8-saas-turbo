import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { PaginationResult } from '@hl8/rest';

import {
  MenuProperties,
  MenuTreeProperties,
} from '@/lib/bounded-contexts/iam/menu/domain/menu.read.model';
import { PageMenusQuery } from '@/lib/bounded-contexts/iam/menu/queries/page-menus.query';

import { MenuReadPostgresRepository } from './menu.read.pg.repository';

/**
 * MenuReadPostgresRepository 单元测试
 *
 * @description
 * 测试菜单读取仓储的实现，验证菜单查询、分页查询、角色关联查询等功能。
 */
describe('MenuReadPostgresRepository', () => {
  let repository: MenuReadPostgresRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      count: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuReadPostgresRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<MenuReadPostgresRepository>(
      MenuReadPostgresRepository,
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

  describe('getChildrenMenuCount', () => {
    /**
     * 应该成功获取子菜单数量
     *
     * 验证当父菜单存在子菜单时，能够正确返回子菜单数量。
     */
    it('应该成功获取子菜单数量', async () => {
      const parentId = 1;
      const expectedCount = 3;

      (entityManager.count as jest.Mock).mockResolvedValue(expectedCount);

      const result = await repository.getChildrenMenuCount(parentId);

      expect(result).toBe(expectedCount);
      expect(entityManager.count).toHaveBeenCalledWith('SysMenu', {
        pid: parentId,
      });
      expect(entityManager.count).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回 0 当没有子菜单时
     *
     * 验证当父菜单没有子菜单时，方法返回 0。
     */
    it('应该返回 0 当没有子菜单时', async () => {
      const parentId = 2;

      (entityManager.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.getChildrenMenuCount(parentId);

      expect(result).toBe(0);
      expect(entityManager.count).toHaveBeenCalledWith('SysMenu', {
        pid: parentId,
      });
    });
  });

  describe('getMenuById', () => {
    /**
     * 应该成功根据 ID 获取菜单
     *
     * 验证当菜单存在时，能够正确返回菜单属性。
     */
    it('应该成功根据 ID 获取菜单', async () => {
      const menuId = 1;
      const mockMenu: MenuProperties = {
        id: menuId,
        menuType: MenuType.MENU,
        menuName: '测试菜单',
        routeName: 'test-menu',
        routePath: '/test',
        component: 'TestComponent',
        status: Status.ENABLED,
        pid: 0,
        order: 1,
        constant: false,
        iconType: null,
        icon: null,
        pathParam: null,
        activeMenu: null,
        hideInMenu: false,
        i18nKey: null,
        keepAlive: false,
        href: null,
        multiTab: false,
      } as MenuProperties;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockMenu);

      const result = await repository.getMenuById(menuId);

      expect(result).toEqual(mockMenu);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysMenu', {
        id: menuId,
      });
    });

    /**
     * 应该返回 null 当菜单不存在时
     *
     * 验证当菜单不存在时，方法返回 null。
     */
    it('应该返回 null 当菜单不存在时', async () => {
      const menuId = 999;

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.getMenuById(menuId);

      expect(result).toBeNull();
    });
  });

  describe('findMenusByRoleCode', () => {
    /**
     * 应该成功根据角色代码查找菜单
     *
     * 验证当角色存在菜单关联时，能够正确返回菜单列表。
     */
    it('应该成功根据角色代码查找菜单', async () => {
      const roleCodes = ['admin', 'user'];
      const domain = 'example.com';

      // Mock 角色数据
      const mockRoles = [{ id: 'role-1' }, { id: 'role-2' }];

      // Mock 角色菜单关联数据
      const mockRoleMenus = [{ menuId: 1 }, { menuId: 2 }];

      // Mock 菜单数据
      const mockMenus: MenuProperties[] = [
        {
          id: 1,
          menuType: MenuType.MENU,
          menuName: '菜单1',
          routeName: 'menu1',
          routePath: '/menu1',
          component: 'Menu1Component',
          status: Status.ENABLED,
          pid: 0,
          order: 1,
          constant: false,
        } as MenuProperties,
        {
          id: 2,
          menuType: MenuType.MENU,
          menuName: '菜单2',
          routeName: 'menu2',
          routePath: '/menu2',
          component: 'Menu2Component',
          status: Status.ENABLED,
          pid: 0,
          order: 2,
          constant: false,
        } as MenuProperties,
      ];

      (entityManager.find as jest.Mock)
        .mockResolvedValueOnce(mockRoles) // 第一次调用：查询角色
        .mockResolvedValueOnce(mockRoleMenus) // 第二次调用：查询角色菜单关联
        .mockResolvedValueOnce(mockMenus); // 第三次调用：查询菜单

      const result = await repository.findMenusByRoleCode(roleCodes, domain);

      expect(result).toEqual(mockMenus);
      expect(result.length).toBe(2);

      // 验证第一次查询：查询角色
      expect(entityManager.find).toHaveBeenNthCalledWith(
        1,
        'SysRole',
        { code: { $in: roleCodes } },
        { fields: ['id'] },
      );

      // 验证第二次查询：查询角色菜单关联
      expect(entityManager.find).toHaveBeenNthCalledWith(
        2,
        'SysRoleMenu',
        { roleId: { $in: ['role-1', 'role-2'] }, domain },
        { fields: ['menuId'] },
      );

      // 验证第三次查询：查询菜单
      expect(entityManager.find).toHaveBeenNthCalledWith(3, 'SysMenu', {
        id: { $in: [1, 2] },
        status: Status.ENABLED,
      });
    });

    /**
     * 应该返回空数组当角色不存在时
     *
     * 验证当角色不存在时，方法返回空数组。
     */
    it('应该返回空数组当角色不存在时', async () => {
      const roleCodes = ['non-existent-role'];
      const domain = 'example.com';

      (entityManager.find as jest.Mock).mockResolvedValueOnce([]);

      const result = await repository.findMenusByRoleCode(roleCodes, domain);

      expect(result).toEqual([]);
      expect(entityManager.find).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空数组当角色没有菜单关联时
     *
     * 验证当角色存在但没有菜单关联时，方法返回空数组。
     */
    it('应该返回空数组当角色没有菜单关联时', async () => {
      const roleCodes = ['admin'];
      const domain = 'example.com';

      const mockRoles = [{ id: 'role-1' }];

      (entityManager.find as jest.Mock)
        .mockResolvedValueOnce(mockRoles)
        .mockResolvedValueOnce([]);

      const result = await repository.findMenusByRoleCode(roleCodes, domain);

      expect(result).toEqual([]);
    });
  });

  describe('findMenusByRoleId', () => {
    /**
     * 应该成功根据角色 ID 查找菜单
     *
     * 验证当角色存在菜单关联时，能够正确返回菜单列表。
     */
    it('应该成功根据角色 ID 查找菜单', async () => {
      const roleId = 'role-123';
      const domain = 'example.com';

      // Mock 角色菜单关联数据
      const mockRoleMenus = [{ menuId: 1 }, { menuId: 2 }];

      // Mock 菜单数据
      const mockMenus: MenuProperties[] = [
        {
          id: 1,
          menuType: MenuType.MENU,
          menuName: '菜单1',
          routeName: 'menu1',
          routePath: '/menu1',
          component: 'Menu1Component',
          status: Status.ENABLED,
          pid: 0,
          order: 1,
          constant: false,
        } as MenuProperties,
      ];

      (entityManager.find as jest.Mock)
        .mockResolvedValueOnce(mockRoleMenus)
        .mockResolvedValueOnce(mockMenus);

      const result = await repository.findMenusByRoleId(roleId, domain);

      expect(result).toEqual(mockMenus);
      expect(result.length).toBe(1);

      // 验证查询角色菜单关联
      expect(entityManager.find).toHaveBeenNthCalledWith(
        1,
        'SysRoleMenu',
        { roleId, domain },
        { fields: ['menuId'] },
      );

      // 验证查询菜单（包含 constant: false 条件）
      expect(entityManager.find).toHaveBeenNthCalledWith(2, 'SysMenu', {
        id: { $in: [1, 2] },
        status: Status.ENABLED,
        constant: false,
      });
    });

    /**
     * 应该返回空数组当角色没有菜单关联时
     *
     * 验证当角色没有菜单关联时，方法返回空数组。
     */
    it('应该返回空数组当角色没有菜单关联时', async () => {
      const roleId = 'role-without-menus';
      const domain = 'example.com';

      (entityManager.find as jest.Mock).mockResolvedValueOnce([]);

      const result = await repository.findMenusByRoleId(roleId, domain);

      expect(result).toEqual([]);
      expect(entityManager.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConstantRoutes', () => {
    /**
     * 应该成功获取常量路由
     *
     * 验证能够正确返回所有启用的常量菜单。
     */
    it('应该成功获取常量路由', async () => {
      const mockMenus: MenuProperties[] = [
        {
          id: 1,
          menuType: MenuType.MENU,
          menuName: '常量菜单',
          routeName: 'constant-menu',
          routePath: '/constant',
          component: 'ConstantComponent',
          status: Status.ENABLED,
          pid: 0,
          order: 1,
          constant: true,
        } as MenuProperties,
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockMenus);

      const result = await repository.getConstantRoutes();

      expect(result).toEqual(mockMenus);
      expect(entityManager.find).toHaveBeenCalledWith('SysMenu', {
        constant: true,
        status: Status.ENABLED,
      });
    });

    /**
     * 应该返回空数组当没有常量路由时
     *
     * 验证当没有常量路由时，方法返回空数组。
     */
    it('应该返回空数组当没有常量路由时', async () => {
      (entityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.getConstantRoutes();

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    /**
     * 应该成功查询所有菜单
     *
     * 验证能够正确返回所有菜单的树形结构。
     */
    it('应该成功查询所有菜单', async () => {
      const mockMenus: MenuTreeProperties[] = [
        {
          id: 1,
          menuType: MenuType.MENU,
          menuName: '菜单1',
          routeName: 'menu1',
          routePath: '/menu1',
          component: 'Menu1Component',
          status: Status.ENABLED,
          pid: 0,
          order: 1,
          constant: false,
        } as MenuTreeProperties,
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockMenus);

      const result = await repository.findAll();

      expect(result).toEqual(mockMenus);
      expect(entityManager.find).toHaveBeenCalledWith('SysMenu', {});
    });
  });

  describe('findAllConstantMenu', () => {
    /**
     * 应该成功查询所有常量菜单
     *
     * 验证能够根据常量标志正确返回菜单列表。
     */
    it('应该成功查询所有常量菜单', async () => {
      const constant = true;
      const mockMenus: MenuTreeProperties[] = [
        {
          id: 1,
          menuType: MenuType.MENU,
          menuName: '常量菜单',
          routeName: 'constant-menu',
          routePath: '/constant',
          component: 'ConstantComponent',
          status: Status.ENABLED,
          pid: 0,
          order: 1,
          constant: true,
        } as MenuTreeProperties,
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockMenus);

      const result = await repository.findAllConstantMenu(constant);

      expect(result).toEqual(mockMenus);
      expect(entityManager.find).toHaveBeenCalledWith('SysMenu', {
        constant,
      });
    });

    /**
     * 应该成功查询所有非常量菜单
     *
     * 验证当 constant 为 false 时，能够正确返回非常量菜单。
     */
    it('应该成功查询所有非常量菜单', async () => {
      const constant = false;
      const mockMenus: MenuTreeProperties[] = [];

      (entityManager.find as jest.Mock).mockResolvedValue(mockMenus);

      const result = await repository.findAllConstantMenu(constant);

      expect(result).toEqual([]);
      expect(entityManager.find).toHaveBeenCalledWith('SysMenu', {
        constant,
      });
    });
  });

  describe('findMenusByIds', () => {
    /**
     * 应该成功根据 ID 列表查找菜单
     *
     * 验证能够正确返回指定 ID 列表的菜单。
     */
    it('应该成功根据 ID 列表查找菜单', async () => {
      const menuIds = [1, 2, 3];
      const mockMenus: MenuProperties[] = [
        {
          id: 1,
          menuType: MenuType.MENU,
          menuName: '菜单1',
          routeName: 'menu1',
          routePath: '/menu1',
          component: 'Menu1Component',
          status: Status.ENABLED,
          pid: 0,
          order: 1,
          constant: false,
        } as MenuProperties,
        {
          id: 2,
          menuType: MenuType.MENU,
          menuName: '菜单2',
          routeName: 'menu2',
          routePath: '/menu2',
          component: 'Menu2Component',
          status: Status.ENABLED,
          pid: 0,
          order: 2,
          constant: false,
        } as MenuProperties,
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockMenus);

      const result = await repository.findMenusByIds(menuIds);

      expect(result).toEqual(mockMenus);
      expect(entityManager.find).toHaveBeenCalledWith('SysMenu', {
        id: { $in: menuIds },
      });
    });

    /**
     * 应该返回空数组当菜单不存在时
     *
     * 验证当菜单不存在时，方法返回空数组。
     */
    it('应该返回空数组当菜单不存在时', async () => {
      const menuIds = [999, 998];

      (entityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.findMenusByIds(menuIds);

      expect(result).toEqual([]);
    });
  });

  describe('findMenuIdsByUserId', () => {
    /**
     * 应该成功根据用户 ID 查找菜单 ID 列表
     *
     * 验证当用户存在角色关联且角色有菜单关联时，能够正确返回菜单 ID 列表。
     */
    it('应该成功根据用户 ID 查找菜单 ID 列表', async () => {
      const userId = 'user-123';
      const domain = 'example.com';

      // Mock 用户角色关联数据
      const mockUserRoles = [{ roleId: 'role-1' }, { roleId: 'role-2' }];

      // Mock 角色菜单关联数据
      const mockRoleMenus = [{ menuId: 1 }, { menuId: 2 }, { menuId: 3 }];

      (entityManager.find as jest.Mock)
        .mockResolvedValueOnce(mockUserRoles)
        .mockResolvedValueOnce(mockRoleMenus);

      const result = await repository.findMenuIdsByUserId(userId, domain);

      expect(result).toEqual([1, 2, 3]);
      expect(result.length).toBe(3);

      // 验证第一次查询：查询用户角色关联
      expect(entityManager.find).toHaveBeenNthCalledWith(
        1,
        'SysUserRole',
        { userId },
        { fields: ['roleId'] },
      );

      // 验证第二次查询：查询角色菜单关联
      expect(entityManager.find).toHaveBeenNthCalledWith(
        2,
        'SysRoleMenu',
        { roleId: { $in: ['role-1', 'role-2'] }, domain },
        { fields: ['menuId'] },
      );
    });

    /**
     * 应该返回空数组当用户没有角色关联时
     *
     * 验证当用户没有角色关联时，方法返回空数组。
     */
    it('应该返回空数组当用户没有角色关联时', async () => {
      const userId = 'user-without-roles';
      const domain = 'example.com';

      (entityManager.find as jest.Mock).mockResolvedValueOnce([]);

      const result = await repository.findMenuIdsByUserId(userId, domain);

      expect(result).toEqual([]);
      expect(entityManager.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('pageMenus', () => {
    /**
     * 应该成功分页查询菜单（无筛选条件）
     *
     * 验证当没有筛选条件时，能够正确返回分页结果。
     */
    it('应该成功分页查询菜单（无筛选条件）', async () => {
      const query = new PageMenusQuery({
        current: 1,
        size: 10,
      });

      const mockMenus: MenuProperties[] = [
        {
          id: 1,
          menuType: MenuType.MENU,
          menuName: '菜单1',
          routeName: 'menu1',
          routePath: '/menu1',
          component: 'Menu1Component',
          status: Status.ENABLED,
          pid: 0,
          order: 1,
          constant: false,
        } as MenuProperties,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockMenus,
        1,
      ]);

      const result = await repository.pageMenus(query);

      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.current).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(1);
      expect(result.records).toEqual(mockMenus);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysMenu',
        {},
        {
          limit: 10,
          offset: 0,
          orderBy: [{ order: 'ASC' }],
        },
      );
    });

    /**
     * 应该成功分页查询菜单（按菜单名称筛选）
     *
     * 验证当提供菜单名称筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询菜单（按菜单名称筛选）', async () => {
      const query = new PageMenusQuery({
        current: 1,
        size: 10,
        menuName: '测试',
      });

      const mockMenus: MenuProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockMenus,
        0,
      ]);

      const result = await repository.pageMenus(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysMenu',
        { menuName: { $like: '%测试%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ order: 'ASC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询菜单（按路由名称筛选）
     *
     * 验证当提供路由名称筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询菜单（按路由名称筛选）', async () => {
      const query = new PageMenusQuery({
        current: 1,
        size: 10,
        routeName: 'menu',
      });

      const mockMenus: MenuProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockMenus,
        0,
      ]);

      const result = await repository.pageMenus(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysMenu',
        { routeName: { $like: '%menu%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ order: 'ASC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询菜单（按菜单类型筛选）
     *
     * 验证当提供菜单类型筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询菜单（按菜单类型筛选）', async () => {
      const query = new PageMenusQuery({
        current: 1,
        size: 10,
        menuType: MenuType.MENU,
      });

      const mockMenus: MenuProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockMenus,
        0,
      ]);

      const result = await repository.pageMenus(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysMenu',
        { menuType: MenuType.MENU },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ order: 'ASC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询菜单（按状态筛选）
     *
     * 验证当提供状态筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询菜单（按状态筛选）', async () => {
      const query = new PageMenusQuery({
        current: 1,
        size: 10,
        status: Status.DISABLED,
      });

      const mockMenus: MenuProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockMenus,
        0,
      ]);

      const result = await repository.pageMenus(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysMenu',
        { status: Status.DISABLED },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ order: 'ASC' }],
        }),
      );
    });
  });
});

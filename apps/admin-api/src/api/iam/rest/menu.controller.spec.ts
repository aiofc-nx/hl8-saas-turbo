import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { MenuRoute } from '@/lib/bounded-contexts/iam/menu/application/dto/route.dto';
import { MenuService } from '@/lib/bounded-contexts/iam/menu/application/service/menu.service';
import { MenuCreateCommand } from '@/lib/bounded-contexts/iam/menu/commands/menu-create.command';
import { MenuDeleteCommand } from '@/lib/bounded-contexts/iam/menu/commands/menu-delete.command';
import { MenuUpdateCommand } from '@/lib/bounded-contexts/iam/menu/commands/menu-update.command';
import {
  MenuProperties,
  type MenuTreeProperties,
} from '@/lib/bounded-contexts/iam/menu/domain/menu.read.model';
import { MenuIdsByRoleIdAndDomainQuery } from '@/lib/bounded-contexts/iam/menu/queries/menu-ids.by-role_id&domain.query';
import { MenusQuery } from '@/lib/bounded-contexts/iam/menu/queries/menus.query';
import { MenusTreeQuery } from '@/lib/bounded-contexts/iam/menu/queries/menus.tree.query';
import { PageMenusQuery } from '@/lib/bounded-contexts/iam/menu/queries/page-menus.query';
import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { PageMenusDto } from '../dto/page-menus.dto';
import { RouteCreateDto, RouteUpdateDto } from '../dto/route.dto';
import { MenuController } from './menu.controller';

/**
 * MenuController 单元测试
 *
 * @description
 * 测试菜单/路由控制器的实现，验证分页查询、创建、更新、删除路由和获取路由树等功能。
 */
describe('MenuController', () => {
  let controller: MenuController;
  let queryBus: jest.Mocked<QueryBus>;
  let commandBus: jest.Mocked<CommandBus>;
  let menuService: jest.Mocked<MenuService>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock QueryBus、CommandBus 和 MenuService 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock QueryBus、CommandBus 和 MenuService
    const mockQueryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    const mockCommandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    const mockMenuService = {
      getConstantRoutes: jest.fn(),
    } as unknown as jest.Mocked<MenuService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuController],
      providers: [
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: MenuService,
          useValue: mockMenuService,
        },
      ],
    }).compile();

    controller = module.get<MenuController>(MenuController);
    queryBus = module.get(QueryBus);
    commandBus = module.get(CommandBus);
    menuService = module.get(MenuService);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConstantRoutes', () => {
    /**
     * 应该成功获取常量路由
     *
     * 验证能够正确获取所有常量路由。
     */
    it('应该成功获取常量路由', async () => {
      const mockRoutes: MenuRoute[] = [
        {
          path: '/login',
          name: 'login',
          component: 'Login',
        },
        {
          path: '/404',
          name: '404',
          component: 'NotFound',
        },
      ];

      (menuService.getConstantRoutes as jest.Mock).mockResolvedValue(
        mockRoutes,
      );

      const result = await controller.getConstantRoutes();

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockRoutes);
      expect(menuService.getConstantRoutes).toHaveBeenCalledTimes(1);
    });
  });

  describe('page', () => {
    /**
     * 应该成功分页查询菜单列表
     *
     * 验证能够正确执行分页查询并返回结果。
     */
    it('应该成功分页查询菜单列表', async () => {
      const queryDto = new PageMenusDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.menuName = '用户';
      queryDto.routeName = 'user';
      queryDto.menuType = MenuType.MENU;
      queryDto.status = Status.ENABLED;

      const mockResult = new PaginationResult<MenuProperties>(1, 10, 2, [
        {
          id: 1,
          menuName: '用户管理',
          menuType: MenuType.MENU,
          routeName: 'user-management',
          routePath: '/user',
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
        } as MenuProperties,
      ]);

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.page(queryDto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(PageMenusQuery));
    });
  });

  describe('routes', () => {
    /**
     * 应该成功获取所有路由列表
     *
     * 验证能够正确获取所有路由的扁平化列表。
     */
    it('应该成功获取所有路由列表', async () => {
      const mockRoutes: MenuTreeProperties[] = [
        {
          id: 1,
          menuName: '用户管理',
          menuType: MenuType.MENU,
          routeName: 'user-management',
          routePath: '/user',
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
        } as MenuTreeProperties,
      ];

      (queryBus.execute as jest.Mock).mockResolvedValue(mockRoutes);

      const result = await controller.routes();

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockRoutes);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(MenusQuery));
    });
  });

  describe('treeRoute', () => {
    /**
     * 应该成功获取路由树
     *
     * 验证能够正确获取路由的树形结构。
     */
    it('应该成功获取路由树', async () => {
      const mockTree: MenuTreeProperties[] = [
        {
          id: 1,
          menuName: '系统管理',
          menuType: MenuType.DIRECTORY,
          routeName: 'system',
          routePath: '/system',
          component: 'Layout',
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
          children: [
            {
              id: 2,
              menuName: '用户管理',
              menuType: MenuType.MENU,
              routeName: 'user-management',
              routePath: '/system/user',
              component: 'UserManagement',
              status: Status.ENABLED,
              pid: 1,
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
            } as MenuTreeProperties,
          ],
        } as MenuTreeProperties,
      ];

      (queryBus.execute as jest.Mock).mockResolvedValue(mockTree);

      const result = await controller.treeRoute();

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockTree);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(MenusTreeQuery));
    });
  });

  describe('createRoute', () => {
    /**
     * 应该成功创建路由
     *
     * 验证能够正确执行创建路由命令并返回成功结果。
     */
    it('应该成功创建路由', async () => {
      const dto = new RouteCreateDto();
      dto.menuName = '用户管理';
      dto.menuType = MenuType.MENU;
      dto.routeName = 'user-management';
      dto.routePath = '/user';
      dto.component = 'UserManagement';
      dto.status = Status.ENABLED;
      dto.pid = 0;
      dto.order = 1;

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.createRoute(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(MenuCreateCommand),
      );
    });
  });

  describe('updateRoute', () => {
    /**
     * 应该成功更新路由
     *
     * 验证能够正确执行更新路由命令并返回成功结果。
     */
    it('应该成功更新路由', async () => {
      const dto = new RouteUpdateDto();
      dto.id = 1;
      dto.menuName = '更新后的菜单名';
      dto.menuType = MenuType.MENU;
      dto.routeName = 'user-management';
      dto.routePath = '/user';
      dto.component = 'UserManagement';
      dto.status = Status.DISABLED;

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.updateRoute(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(MenuUpdateCommand),
      );
    });
  });

  describe('deleteRoute', () => {
    /**
     * 应该成功删除路由
     *
     * 验证能够正确执行删除路由命令并返回成功结果。
     */
    it('应该成功删除路由', async () => {
      const routeId = 1;

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deleteRoute(routeId);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(MenuDeleteCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(MenuDeleteCommand);
      expect(command.id).toBe(routeId);
    });
  });

  describe('authRoute', () => {
    /**
     * 应该成功获取角色的授权路由
     *
     * 验证能够正确获取指定角色在指定域下已授权的路由 ID 列表。
     */
    it('应该成功获取角色的授权路由', async () => {
      const roleId = 'role-123';
      const mockRequest = {
        user: {
          uid: 'user-123',
          domain: 'example.com',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const mockRouteIds = [1, 2, 3];

      (queryBus.execute as jest.Mock).mockResolvedValue(mockRouteIds);

      const result = await controller.authRoute(roleId, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockRouteIds);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(MenuIdsByRoleIdAndDomainQuery),
      );
    });
  });
});

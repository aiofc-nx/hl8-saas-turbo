import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ROOT_ROUTE_PID } from '@/lib/shared/constants/db.constant';
import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { MenuCreateCommand } from '../../commands/menu-create.command';
import { MenuReadRepoPortToken, MenuWriteRepoPortToken } from '../../constants';
import type { MenuProperties } from '../../domain/menu.read.model';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';
import type { MenuWriteRepoPort } from '../../ports/menu.write.repo-port';
import { MenuCreateHandler } from './menu-create.command.handler';

/**
 * MenuCreateHandler 单元测试
 *
 * @description
 * 测试菜单创建命令处理器的业务逻辑。
 */
describe('MenuCreateHandler', () => {
  let handler: MenuCreateHandler;
  let menuWriteRepository: jest.Mocked<MenuWriteRepoPort>;
  let menuReadRepoPort: jest.Mocked<MenuReadRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockMenuWriteRepository: MenuWriteRepoPort = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<MenuWriteRepoPort>;

    const mockMenuReadRepoPort: MenuReadRepoPort = {
      getMenuById: jest.fn(),
      pageMenus: jest.fn(),
      getChildrenMenuCount: jest.fn(),
    } as unknown as jest.Mocked<MenuReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuCreateHandler,
        {
          provide: MenuWriteRepoPortToken,
          useValue: mockMenuWriteRepository,
        },
        {
          provide: MenuReadRepoPortToken,
          useValue: mockMenuReadRepoPort,
        },
      ],
    }).compile();

    handler = module.get<MenuCreateHandler>(MenuCreateHandler);
    menuWriteRepository = module.get(MenuWriteRepoPortToken);
    menuReadRepoPort = module.get(MenuReadRepoPortToken);
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
     * 应该成功创建菜单（根菜单）
     *
     * 验证当提供有效的命令且为根菜单时，处理器能够正确创建菜单。
     */
    it('应该成功创建菜单（根菜单）', async () => {
      const command = new MenuCreateCommand(
        '用户管理',
        MenuType.MENU,
        null, // iconType
        null, // icon
        'user-management',
        '/user',
        'UserManagement',
        null, // pathParam
        Status.ENABLED,
        null, // activeMenu
        null, // hideInMenu
        Number(ROOT_ROUTE_PID),
        1, // order
        null, // i18nKey
        null, // keepAlive
        false, // constant
        null, // href
        null, // multiTab
        'user-123',
      );

      await handler.execute(command);

      expect(menuWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(menuReadRepoPort.getMenuById).not.toHaveBeenCalled(); // 根菜单不需要验证父菜单
    });

    /**
     * 应该成功创建菜单（有父菜单）
     *
     * 验证当提供有效的命令且有父菜单时，处理器能够正确创建菜单。
     */
    it('应该成功创建菜单（有父菜单）', async () => {
      const parentMenuId = 1;
      const command = new MenuCreateCommand(
        '子菜单',
        MenuType.MENU,
        null, // iconType
        null, // icon
        'sub-menu',
        '/sub',
        'SubMenu',
        null, // pathParam
        Status.ENABLED,
        null, // activeMenu
        null, // hideInMenu
        parentMenuId,
        1, // order
        null, // i18nKey
        null, // keepAlive
        false, // constant
        null, // href
        null, // multiTab
        'user-123',
      );

      const parentMenu: MenuProperties = {
        id: parentMenuId,
        menuName: '父菜单',
        menuType: MenuType.DIRECTORY,
        routeName: 'parent',
        routePath: '/parent',
        component: 'Parent',
        status: Status.ENABLED,
        pid: Number(ROOT_ROUTE_PID),
        order: 1,
        constant: false,
        createdAt: new Date(),
        createdBy: 'user-1',
      } as MenuProperties;

      (menuReadRepoPort.getMenuById as jest.Mock).mockResolvedValue(parentMenu);

      await handler.execute(command);

      expect(menuReadRepoPort.getMenuById).toHaveBeenCalledWith(parentMenuId);
      expect(menuWriteRepository.save).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该抛出异常当父菜单不存在时
     *
     * 验证当父菜单不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当父菜单不存在时', async () => {
      const parentMenuId = 999;
      const command = new MenuCreateCommand(
        '子菜单',
        MenuType.MENU,
        null, // iconType
        null, // icon
        'sub-menu',
        '/sub',
        'SubMenu',
        null, // pathParam
        Status.ENABLED,
        null, // activeMenu
        null, // hideInMenu
        parentMenuId,
        1, // order
        null, // i18nKey
        null, // keepAlive
        false, // constant
        null, // href
        null, // multiTab
        'user-123',
      );

      (menuReadRepoPort.getMenuById as jest.Mock).mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        `Parent menu with code ${parentMenuId} does not exist.`,
      );
      expect(menuWriteRepository.save).not.toHaveBeenCalled();
    });
  });
});

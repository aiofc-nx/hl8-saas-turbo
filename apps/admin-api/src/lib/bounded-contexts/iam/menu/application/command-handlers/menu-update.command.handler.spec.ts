import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ROOT_ROUTE_PID } from '@/lib/shared/constants/db.constant';
import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { MenuUpdateCommand } from '../../commands/menu-update.command';
import { MenuReadRepoPortToken, MenuWriteRepoPortToken } from '../../constants';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';
import type { MenuWriteRepoPort } from '../../ports/menu.write.repo-port';
import { MenuUpdateHandler } from './menu-update.command.handler';

/**
 * MenuUpdateHandler 单元测试
 *
 * @description
 * 测试菜单更新命令处理器的业务逻辑。
 */
describe('MenuUpdateHandler', () => {
  let handler: MenuUpdateHandler;
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
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<MenuWriteRepoPort>;

    const mockMenuReadRepoPort: MenuReadRepoPort = {
      getMenuById: jest.fn(),
      pageMenus: jest.fn(),
      getChildrenMenuCount: jest.fn(),
    } as unknown as jest.Mocked<MenuReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuUpdateHandler,
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

    handler = module.get<MenuUpdateHandler>(MenuUpdateHandler);
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
     * 应该成功更新菜单
     *
     * 验证当提供有效的命令时，处理器能够正确更新菜单。
     */
    it('应该成功更新菜单', async () => {
      const menuId = 1;
      const command = new MenuUpdateCommand(
        menuId,
        '更新后的菜单',
        MenuType.MENU,
        null, // iconType
        null, // icon
        'updated-menu',
        '/updated',
        'UpdatedMenu',
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

      expect(menuWriteRepository.update).toHaveBeenCalledTimes(1);
      expect(menuReadRepoPort.getMenuById).not.toHaveBeenCalled(); // 根菜单不需要验证父菜单
    });

    /**
     * 应该抛出异常当父菜单ID与自身ID相同时
     *
     * 验证当父菜单ID与自身ID相同时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当父菜单ID与自身ID相同时', async () => {
      const menuId = 1;
      const command = new MenuUpdateCommand(
        menuId,
        '菜单',
        MenuType.MENU,
        null, // iconType
        null, // icon
        'menu',
        '/menu',
        'Menu',
        null, // pathParam
        Status.ENABLED,
        null, // activeMenu
        null, // hideInMenu
        menuId, // 父菜单ID与自身ID相同
        1, // order
        null, // i18nKey
        null, // keepAlive
        false, // constant
        null, // href
        null, // multiTab
        'user-123',
      );

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        `The parent menu identifier '${menuId}' cannot be the same as its own identifier.`,
      );
      expect(menuWriteRepository.update).not.toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当父菜单不存在时
     *
     * 验证当父菜单不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当父菜单不存在时', async () => {
      const menuId = 1;
      const parentMenuId = 999;
      const command = new MenuUpdateCommand(
        menuId,
        '菜单',
        MenuType.MENU,
        null, // iconType
        null, // icon
        'menu',
        '/menu',
        'Menu',
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
      expect(menuWriteRepository.update).not.toHaveBeenCalled();
    });
  });
});

import { BadRequestException } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { MenuDeleteCommand } from '../../commands/menu-delete.command';
import { MenuReadRepoPortToken, MenuWriteRepoPortToken } from '../../constants';
import type { MenuProperties } from '../../domain/menu.read.model';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';
import type { MenuWriteRepoPort } from '../../ports/menu.write.repo-port';
import { MenuDeleteHandler } from './menu-delete.command.handler';

/**
 * MenuDeleteHandler 单元测试
 *
 * @description
 * 测试菜单删除命令处理器的业务逻辑。
 */
describe('MenuDeleteHandler', () => {
  let handler: MenuDeleteHandler;
  let menuWriteRepository: jest.Mocked<MenuWriteRepoPort>;
  let menuReadRepoPort: jest.Mocked<MenuReadRepoPort>;
  let publisher: jest.Mocked<EventPublisher>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockMenuWriteRepository: MenuWriteRepoPort = {
      save: jest.fn(),
      update: jest.fn(),
      deleteById: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<MenuWriteRepoPort>;

    const mockMenuReadRepoPort: MenuReadRepoPort = {
      getMenuById: jest.fn(),
      pageMenus: jest.fn(),
      getChildrenMenuCount: jest.fn(),
    } as unknown as jest.Mocked<MenuReadRepoPort>;

    const mockPublisher = {
      mergeObjectContext: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<EventPublisher>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuDeleteHandler,
        {
          provide: MenuWriteRepoPortToken,
          useValue: mockMenuWriteRepository,
        },
        {
          provide: MenuReadRepoPortToken,
          useValue: mockMenuReadRepoPort,
        },
        {
          provide: EventPublisher,
          useValue: mockPublisher,
        },
      ],
    }).compile();

    handler = module.get<MenuDeleteHandler>(MenuDeleteHandler);
    menuWriteRepository = module.get(MenuWriteRepoPortToken);
    menuReadRepoPort = module.get(MenuReadRepoPortToken);
    publisher = module.get(EventPublisher);
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
     * 应该成功删除菜单
     *
     * 验证当提供有效的命令时，处理器能够正确删除菜单。
     */
    it('应该成功删除菜单', async () => {
      const command = new MenuDeleteCommand(1);

      const existingMenu: MenuProperties = {
        id: 1,
        menuName: '测试菜单',
        menuType: MenuType.MENU,
        routeName: 'test-menu',
        routePath: '/test',
        component: 'TestMenu',
        status: Status.ENABLED,
        pid: 0,
        order: 1,
        constant: false,
        createdAt: new Date(),
        createdBy: 'user-1',
      } as MenuProperties;

      (menuReadRepoPort.getMenuById as jest.Mock).mockResolvedValue(
        existingMenu,
      );
      (menuReadRepoPort.getChildrenMenuCount as jest.Mock).mockResolvedValue(0);

      await handler.execute(command);

      expect(menuReadRepoPort.getMenuById).toHaveBeenCalledWith(1);
      expect(menuReadRepoPort.getChildrenMenuCount).toHaveBeenCalledWith(1);
      expect(menuWriteRepository.deleteById).toHaveBeenCalledWith(1);
      expect(publisher.mergeObjectContext).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当菜单不存在时
     *
     * 验证当菜单不存在时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当菜单不存在时', async () => {
      const command = new MenuDeleteCommand(999);

      (menuReadRepoPort.getMenuById as jest.Mock).mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'A menu with the specified ID does not exist.',
      );
      expect(menuWriteRepository.deleteById).not.toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当菜单有子菜单时
     *
     * 验证当菜单有子菜单时，处理器能够正确抛出异常。
     */
    it('应该抛出异常当菜单有子菜单时', async () => {
      const command = new MenuDeleteCommand(1);

      const existingMenu: MenuProperties = {
        id: 1,
        menuName: '父菜单',
        menuType: MenuType.DIRECTORY,
        routeName: 'parent-menu',
        routePath: '/parent',
        component: 'ParentMenu',
        status: Status.ENABLED,
        pid: 0,
        order: 1,
        constant: false,
        createdAt: new Date(),
        createdBy: 'user-1',
      } as MenuProperties;

      (menuReadRepoPort.getMenuById as jest.Mock).mockResolvedValue(
        existingMenu,
      );
      (menuReadRepoPort.getChildrenMenuCount as jest.Mock).mockResolvedValue(
        2, // 有 2 个子菜单
      );

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'Cannot delete the menu with ID 1 because it has sub-menus. Please delete the sub-menus first.',
      );
      expect(menuWriteRepository.deleteById).not.toHaveBeenCalled();
    });
  });
});

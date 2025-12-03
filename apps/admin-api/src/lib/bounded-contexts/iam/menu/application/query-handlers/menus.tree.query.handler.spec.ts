import { Test, TestingModule } from '@nestjs/testing';

import { buildTree } from '@hl8/utils';

import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { MenuReadRepoPortToken } from '../../constants';
import type { MenuTreeProperties } from '../../domain/menu.read.model';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';
import { MenusTreeQuery } from '../../queries/menus.tree.query';
import { MenusTreeQueryHandler } from './menus.tree.query.handler';

// Mock buildTree 函数
jest.mock('@hl8/utils', () => ({
  buildTree: jest.fn(),
}));

/**
 * MenusTreeQueryHandler 单元测试
 *
 * @description
 * 测试查询常量菜单并构建树形结构的查询处理器。
 */
describe('MenusTreeQueryHandler', () => {
  let handler: MenusTreeQueryHandler;
  let repository: jest.Mocked<MenuReadRepoPort>;
  let mockBuildTree: jest.MockedFunction<typeof buildTree>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRepository: MenuReadRepoPort = {
      getMenuById: jest.fn(),
      pageMenus: jest.fn(),
      getChildrenMenuCount: jest.fn(),
      findAllConstantMenu: jest.fn(),
    } as unknown as jest.Mocked<MenuReadRepoPort>;

    mockBuildTree = buildTree as jest.MockedFunction<typeof buildTree>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusTreeQueryHandler,
        {
          provide: MenuReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<MenusTreeQueryHandler>(MenusTreeQueryHandler);
    repository = module.get(MenuReadRepoPortToken);
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
     * 应该成功查询常量菜单并构建树形结构
     *
     * 验证当提供有效的查询时，处理器能够正确返回树形结构的菜单列表。
     */
    it('应该成功查询常量菜单并构建树形结构', async () => {
      const mockMenus: MenuTreeProperties[] = [
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
          constant: true,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as MenuTreeProperties,
        {
          id: 2,
          menuName: '角色管理',
          menuType: MenuType.MENU,
          routeName: 'role-management',
          routePath: '/role',
          component: 'RoleManagement',
          status: Status.ENABLED,
          pid: 0,
          order: 2,
          constant: true,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as MenuTreeProperties,
      ];

      const mockTree: MenuTreeProperties[] = [
        {
          ...mockMenus[0],
          children: [],
        },
        {
          ...mockMenus[1],
          children: [],
        },
      ];

      const query = new MenusTreeQuery(true);

      (repository.findAllConstantMenu as jest.Mock).mockResolvedValue(
        mockMenus,
      );
      mockBuildTree.mockReturnValue(mockTree as any);

      const result = await handler.execute(query);

      expect(result).toEqual(mockTree);
      expect(repository.findAllConstantMenu).toHaveBeenCalledWith(true);
      expect(repository.findAllConstantMenu).toHaveBeenCalledTimes(1);
      expect(mockBuildTree).toHaveBeenCalledWith(
        mockMenus,
        'pid',
        'id',
        'order',
      );
    });

    /**
     * 应该返回空数组当没有常量菜单时
     *
     * 验证当没有常量菜单时，处理器返回空数组。
     */
    it('应该返回空数组当没有常量菜单时', async () => {
      const query = new MenusTreeQuery(true);

      (repository.findAllConstantMenu as jest.Mock).mockResolvedValue([]);
      mockBuildTree.mockReturnValue([]);

      const result = await handler.execute(query);

      expect(result).toHaveLength(0);
      expect(mockBuildTree).toHaveBeenCalledWith([], 'pid', 'id', 'order');
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当仓储抛出异常时，处理器能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const query = new MenusTreeQuery(true);

      const error = new Error('数据库连接失败');
      (repository.findAllConstantMenu as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.findAllConstantMenu).toHaveBeenCalledWith(true);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';

import { buildTree } from '@hl8/utils';

import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { MenuReadRepoPortToken } from '../../constants';
import type { MenuTreeProperties } from '../../domain/menu.read.model';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';
import { MenusQuery } from '../../queries/menus.query';
import { MenusQueryHandler } from './menus.query.handler';

// Mock buildTree 函数
jest.mock('@hl8/utils', () => ({
  buildTree: jest.fn(),
}));

/**
 * MenusQueryHandler 单元测试
 *
 * @description
 * 测试查询所有菜单并构建树形结构的查询处理器。
 */
describe('MenusQueryHandler', () => {
  let handler: MenusQueryHandler;
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
      findAll: jest.fn(),
    } as unknown as jest.Mocked<MenuReadRepoPort>;

    mockBuildTree = buildTree as jest.MockedFunction<typeof buildTree>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusQueryHandler,
        {
          provide: MenuReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<MenusQueryHandler>(MenusQueryHandler);
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
     * 应该成功查询所有菜单并构建树形结构
     *
     * 验证当提供有效的查询时，处理器能够正确返回树形结构的菜单列表。
     */
    it('应该成功查询所有菜单并构建树形结构', async () => {
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
          constant: false,
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
          constant: false,
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

      const query = new MenusQuery();

      (repository.findAll as jest.Mock).mockResolvedValue(mockMenus);
      mockBuildTree.mockReturnValue(mockTree as any);

      const result = await handler.execute(query);

      expect(result).toEqual(mockTree);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(mockBuildTree).toHaveBeenCalledWith(
        mockMenus,
        'pid',
        'id',
        'order',
      );
    });

    /**
     * 应该返回空数组当没有菜单时
     *
     * 验证当没有菜单时，处理器返回空数组。
     */
    it('应该返回空数组当没有菜单时', async () => {
      const query = new MenusQuery();

      (repository.findAll as jest.Mock).mockResolvedValue([]);
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
      const query = new MenusQuery();

      const error = new Error('数据库连接失败');
      (repository.findAll as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });
  });
});

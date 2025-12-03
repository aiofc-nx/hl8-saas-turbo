import { Test, TestingModule } from '@nestjs/testing';

import { PaginationResult } from '@hl8/rest';

import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { MenuReadRepoPortToken } from '../../constants';
import type { MenuProperties } from '../../domain/menu.read.model';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';
import { PageMenusQuery } from '../../queries/page-menus.query';
import { PageMenusQueryHandler } from './page-menus.query.handler';

/**
 * PageMenusQueryHandler 单元测试
 *
 * @description
 * 测试菜单分页查询处理器的业务逻辑。
 */
describe('PageMenusQueryHandler', () => {
  let handler: PageMenusQueryHandler;
  let repository: jest.Mocked<MenuReadRepoPort>;

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
    } as unknown as jest.Mocked<MenuReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageMenusQueryHandler,
        {
          provide: MenuReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<PageMenusQueryHandler>(PageMenusQueryHandler);
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
     * 应该成功执行分页查询
     *
     * 验证当提供有效的查询时，处理器能够正确返回分页结果。
     */
    it('应该成功执行分页查询', async () => {
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
          createdAt: new Date(),
          createdBy: 'user-1',
        } as MenuProperties,
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
        } as MenuProperties,
      ]);

      const query = new PageMenusQuery({
        current: 1,
        size: 10,
        menuName: '管理',
        routeName: 'management',
        menuType: MenuType.MENU,
        status: Status.ENABLED,
      });

      (repository.pageMenus as jest.Mock).mockResolvedValue(mockResult);

      const result = await handler.execute(query);

      expect(result).toEqual(mockResult);
      expect(repository.pageMenus).toHaveBeenCalledWith(query);
      expect(repository.pageMenus).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空结果当没有数据时
     *
     * 验证当没有匹配的菜单时，处理器返回空结果。
     */
    it('应该返回空结果当没有数据时', async () => {
      const mockResult = new PaginationResult<MenuProperties>(1, 10, 0, []);

      const query = new PageMenusQuery({
        current: 1,
        size: 10,
      });

      (repository.pageMenus as jest.Mock).mockResolvedValue(mockResult);

      const result = await handler.execute(query);

      expect(result.records).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当仓储抛出异常时，处理器能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const query = new PageMenusQuery({
        current: 1,
        size: 10,
      });

      const error = new Error('数据库连接失败');
      (repository.pageMenus as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.pageMenus).toHaveBeenCalledWith(query);
    });
  });
});

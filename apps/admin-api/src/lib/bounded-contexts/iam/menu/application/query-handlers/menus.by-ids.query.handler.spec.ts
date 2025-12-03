import { Test, TestingModule } from '@nestjs/testing';

import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { MenuReadRepoPortToken } from '../../constants';
import type { MenuProperties } from '../../domain/menu.read.model';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';
import { MenusByIdsQuery } from '../../queries/menus.by-ids.query';
import { MenusByIdsQueryHandler } from './menus.by-ids.query.handler';

/**
 * MenusByIdsQueryHandler 单元测试
 *
 * @description
 * 测试根据 ID 列表查询菜单的查询处理器。
 */
describe('MenusByIdsQueryHandler', () => {
  let handler: MenusByIdsQueryHandler;
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
      findMenusByIds: jest.fn(),
    } as unknown as jest.Mocked<MenuReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusByIdsQueryHandler,
        {
          provide: MenuReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<MenusByIdsQueryHandler>(MenusByIdsQueryHandler);
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
     * 应该成功查询菜单列表
     *
     * 验证当提供有效的查询时，处理器能够正确返回菜单列表。
     */
    it('应该成功查询菜单列表', async () => {
      const mockMenus: MenuProperties[] = [
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
      ];

      const query = new MenusByIdsQuery([1, 2]);

      (repository.findMenusByIds as jest.Mock).mockResolvedValue(mockMenus);

      const result = await handler.execute(query);

      expect(result).toEqual(mockMenus);
      expect(repository.findMenusByIds).toHaveBeenCalledWith([1, 2]);
      expect(repository.findMenusByIds).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空数组当没有匹配的菜单时
     *
     * 验证当没有匹配的菜单时，处理器返回空数组。
     */
    it('应该返回空数组当没有匹配的菜单时', async () => {
      const query = new MenusByIdsQuery([999, 1000]);

      (repository.findMenusByIds as jest.Mock).mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result).toHaveLength(0);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当仓储抛出异常时，处理器能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const query = new MenusByIdsQuery([1, 2]);

      const error = new Error('数据库连接失败');
      (repository.findMenusByIds as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.findMenusByIds).toHaveBeenCalledWith([1, 2]);
    });
  });
});

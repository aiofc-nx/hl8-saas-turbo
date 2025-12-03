import { Test, TestingModule } from '@nestjs/testing';

import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { MenuReadRepoPortToken } from '../../constants';
import type { MenuProperties } from '../../domain/menu.read.model';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';
import { MenuIdsByRoleCodeAndDomainQuery } from '../../queries/menu-ids.by-role_code&domain.query';
import { MenuIdsByRoleCodeAndDomainQueryHandler } from './menu-ids.by-role_code&domain.query.handler';

/**
 * MenuIdsByRoleCodeAndDomainQueryHandler 单元测试
 *
 * @description
 * 测试根据角色代码和域查询菜单ID列表的查询处理器。
 */
describe('MenuIdsByRoleCodeAndDomainQueryHandler', () => {
  let handler: MenuIdsByRoleCodeAndDomainQueryHandler;
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
      findMenusByRoleCode: jest.fn(),
    } as unknown as jest.Mocked<MenuReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuIdsByRoleCodeAndDomainQueryHandler,
        {
          provide: MenuReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<MenuIdsByRoleCodeAndDomainQueryHandler>(
      MenuIdsByRoleCodeAndDomainQueryHandler,
    );
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
     * 应该成功查询菜单ID列表
     *
     * 验证当提供有效的查询时，处理器能够正确返回菜单ID列表。
     */
    it('应该成功查询菜单ID列表', async () => {
      const roleCode = 'admin';
      const domain = 'example.com';
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

      const query = new MenuIdsByRoleCodeAndDomainQuery(roleCode, domain);

      (repository.findMenusByRoleCode as jest.Mock).mockResolvedValue(
        mockMenus,
      );

      const result = await handler.execute(query);

      expect(result).toEqual([1, 2]);
      expect(repository.findMenusByRoleCode).toHaveBeenCalledWith(
        [roleCode],
        domain,
      );
      expect(repository.findMenusByRoleCode).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空数组当没有匹配的菜单时
     *
     * 验证当没有匹配的菜单时，处理器返回空数组。
     */
    it('应该返回空数组当没有匹配的菜单时', async () => {
      const roleCode = 'user';
      const domain = 'example.com';
      const query = new MenuIdsByRoleCodeAndDomainQuery(roleCode, domain);

      (repository.findMenusByRoleCode as jest.Mock).mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result).toHaveLength(0);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当仓储抛出异常时，处理器能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const roleCode = 'admin';
      const domain = 'example.com';
      const query = new MenuIdsByRoleCodeAndDomainQuery(roleCode, domain);

      const error = new Error('数据库连接失败');
      (repository.findMenusByRoleCode as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.findMenusByRoleCode).toHaveBeenCalledWith(
        [roleCode],
        domain,
      );
    });
  });
});

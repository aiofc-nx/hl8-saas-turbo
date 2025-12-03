import { Test, TestingModule } from '@nestjs/testing';

import { MenuReadRepoPortToken } from '../../constants';
import type { MenuReadRepoPort } from '../../ports/menu.read.repo-port';
import { MenuIdsByUserIdAndDomainQuery } from '../../queries/menu-ids.by-user_id&domain.query';
import { MenuIdsByUserIdAndDomainQueryHandler } from './menu-ids.by-user_id&domain.query.handler';

/**
 * MenuIdsByUserIdAndDomainQueryHandler 单元测试
 *
 * @description
 * 测试根据用户ID和域查询菜单ID列表的查询处理器。
 */
describe('MenuIdsByUserIdAndDomainQueryHandler', () => {
  let handler: MenuIdsByUserIdAndDomainQueryHandler;
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
      findMenuIdsByUserId: jest.fn(),
    } as unknown as jest.Mocked<MenuReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuIdsByUserIdAndDomainQueryHandler,
        {
          provide: MenuReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<MenuIdsByUserIdAndDomainQueryHandler>(
      MenuIdsByUserIdAndDomainQueryHandler,
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
      const userId = 'user-123';
      const domain = 'example.com';
      const mockMenuIds = [1, 2, 3];

      const query = new MenuIdsByUserIdAndDomainQuery(userId, domain);

      (repository.findMenuIdsByUserId as jest.Mock).mockResolvedValue(
        mockMenuIds,
      );

      const result = await handler.execute(query);

      expect(result).toEqual(mockMenuIds);
      expect(repository.findMenuIdsByUserId).toHaveBeenCalledWith(
        userId,
        domain,
      );
      expect(repository.findMenuIdsByUserId).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空数组当用户没有菜单时
     *
     * 验证当用户没有菜单时，处理器返回空数组。
     */
    it('应该返回空数组当用户没有菜单时', async () => {
      const userId = 'user-123';
      const domain = 'example.com';
      const query = new MenuIdsByUserIdAndDomainQuery(userId, domain);

      (repository.findMenuIdsByUserId as jest.Mock).mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result).toHaveLength(0);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当仓储抛出异常时，处理器能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const userId = 'user-123';
      const domain = 'example.com';
      const query = new MenuIdsByUserIdAndDomainQuery(userId, domain);

      const error = new Error('数据库连接失败');
      (repository.findMenuIdsByUserId as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.findMenuIdsByUserId).toHaveBeenCalledWith(
        userId,
        domain,
      );
    });
  });
});

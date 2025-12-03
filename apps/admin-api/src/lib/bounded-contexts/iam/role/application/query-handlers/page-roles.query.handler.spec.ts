import { Test, TestingModule } from '@nestjs/testing';

import { PaginationResult } from '@hl8/rest';

import { Status } from '@/lib/shared/enums/status.enum';

import { RoleReadRepoPortToken } from '../../constants';
import type { RoleProperties } from '../../domain/role.read.model';
import type { RoleReadRepoPort } from '../../ports/role.read.repo-port';
import { PageRolesQuery } from '../../queries/page-roles.query';
import { PageRolesQueryHandler } from './page-roles.query.handler';

/**
 * PageRolesQueryHandler 单元测试
 *
 * @description
 * 测试角色分页查询处理器的业务逻辑。
 */
describe('PageRolesQueryHandler', () => {
  let handler: PageRolesQueryHandler;
  let repository: jest.Mocked<RoleReadRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockRepository: RoleReadRepoPort = {
      getRoleById: jest.fn(),
      getRoleByCode: jest.fn(),
      getRolesByDomain: jest.fn(),
      getRolesByCodes: jest.fn(),
      getRoleCodesByUserId: jest.fn(),
      pageRoles: jest.fn(),
    } as unknown as jest.Mocked<RoleReadRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageRolesQueryHandler,
        {
          provide: RoleReadRepoPortToken,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<PageRolesQueryHandler>(PageRolesQueryHandler);
    repository = module.get(RoleReadRepoPortToken);
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
      const mockResult = new PaginationResult<RoleProperties>(1, 10, 2, [
        {
          id: 'role-1',
          code: 'admin',
          name: '管理员',
          status: Status.ENABLED,
          domain: 'example.com',
          createdAt: new Date(),
          createdBy: 'user-1',
        } as RoleProperties,
        {
          id: 'role-2',
          code: 'user',
          name: '普通用户',
          status: Status.ENABLED,
          domain: 'example.com',
          createdAt: new Date(),
          createdBy: 'user-1',
        } as RoleProperties,
      ]);

      const query = new PageRolesQuery({
        current: 1,
        size: 10,
        code: 'admin',
        name: '管理员',
        status: Status.ENABLED,
      });

      (repository.pageRoles as jest.Mock).mockResolvedValue(mockResult);

      const result = await handler.execute(query);

      expect(result).toEqual(mockResult);
      expect(repository.pageRoles).toHaveBeenCalledWith(query);
      expect(repository.pageRoles).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空结果当没有数据时
     *
     * 验证当没有匹配的角色时，处理器返回空结果。
     */
    it('应该返回空结果当没有数据时', async () => {
      const mockResult = new PaginationResult<RoleProperties>(1, 10, 0, []);

      const query = new PageRolesQuery({
        current: 1,
        size: 10,
      });

      (repository.pageRoles as jest.Mock).mockResolvedValue(mockResult);

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
      const query = new PageRolesQuery({
        current: 1,
        size: 10,
      });

      const error = new Error('数据库连接失败');
      (repository.pageRoles as jest.Mock).mockRejectedValue(error);

      await expect(handler.execute(query)).rejects.toThrow('数据库连接失败');
      expect(repository.pageRoles).toHaveBeenCalledWith(query);
    });
  });
});

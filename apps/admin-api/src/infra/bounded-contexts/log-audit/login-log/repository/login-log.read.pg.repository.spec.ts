import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import type { LoginLogProperties } from '@/lib/bounded-contexts/log-audit/login-log/domain/login-log.read.model';
import { PageLoginLogsQuery } from '@/lib/bounded-contexts/log-audit/login-log/queries/page-login-logs.query';

import { PaginationResult } from '@hl8/rest';

import { LoginLogReadRepository } from './login-log.read.pg.repository';

/**
 * LoginLogReadRepository 单元测试
 *
 * @description
 * 测试登录日志读取仓储的实现，验证分页查询登录日志的功能。
 */
describe('LoginLogReadRepository', () => {
  let repository: LoginLogReadRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      findAndCount: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginLogReadRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<LoginLogReadRepository>(LoginLogReadRepository);
    entityManager = module.get(EntityManager);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('pageLoginLogs', () => {
    /**
     * 应该成功分页查询登录日志（无筛选条件）
     *
     * 验证当没有筛选条件时，能够正确返回分页结果。
     */
    it('应该成功分页查询登录日志（无筛选条件）', async () => {
      const query = new PageLoginLogsQuery({
        current: 1,
        size: 10,
      });

      const mockLoginLogs: LoginLogProperties[] = [
        {
          id: 'log-1',
          username: 'user1',
          domain: 'example.com',
          loginTime: new Date(),
          ip: '192.168.1.1',
          port: 8080,
          address: '北京市',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-1',
          type: 'success',
          createdAt: new Date(),
          createdBy: 'system',
        } as LoginLogProperties,
        {
          id: 'log-2',
          username: 'user2',
          domain: 'example.com',
          loginTime: new Date(),
          ip: '192.168.1.2',
          port: null,
          address: '上海市',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-2',
          type: 'success',
          createdAt: new Date(),
          createdBy: 'system',
        } as LoginLogProperties,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLoginLogs,
        2,
      ]);

      const result = await repository.pageLoginLogs(query);

      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.current).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(2);
      expect(result.records).toEqual(mockLoginLogs);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysLoginLog',
        {},
        {
          limit: 10,
          offset: 0,
          orderBy: [{ loginTime: 'DESC' }],
        },
      );
    });

    /**
     * 应该成功分页查询登录日志（按用户名筛选）
     *
     * 验证当提供用户名筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询登录日志（按用户名筛选）', async () => {
      const query = new PageLoginLogsQuery({
        current: 1,
        size: 10,
        username: 'user1',
      });

      const mockLoginLogs: LoginLogProperties[] = [
        {
          id: 'log-1',
          username: 'user1',
          domain: 'example.com',
          loginTime: new Date(),
          ip: '192.168.1.1',
          port: 8080,
          address: '北京市',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-1',
          type: 'success',
          createdAt: new Date(),
          createdBy: 'system',
        } as LoginLogProperties,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLoginLogs,
        1,
      ]);

      const result = await repository.pageLoginLogs(query);

      expect(result.total).toBe(1);
      expect(result.records).toEqual(mockLoginLogs);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysLoginLog',
        { username: { $like: '%user1%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ loginTime: 'DESC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询登录日志（按域名筛选）
     *
     * 验证当提供域名筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询登录日志（按域名筛选）', async () => {
      const query = new PageLoginLogsQuery({
        current: 1,
        size: 10,
        domain: 'example.com',
      });

      const mockLoginLogs: LoginLogProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLoginLogs,
        0,
      ]);

      const result = await repository.pageLoginLogs(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysLoginLog',
        { domain: 'example.com' },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ loginTime: 'DESC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询登录日志（按地址筛选）
     *
     * 验证当提供地址筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询登录日志（按地址筛选）', async () => {
      const query = new PageLoginLogsQuery({
        current: 1,
        size: 10,
        address: '北京',
      });

      const mockLoginLogs: LoginLogProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLoginLogs,
        0,
      ]);

      const result = await repository.pageLoginLogs(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysLoginLog',
        { address: { $like: '%北京%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ loginTime: 'DESC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询登录日志（按类型筛选）
     *
     * 验证当提供类型筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询登录日志（按类型筛选）', async () => {
      const query = new PageLoginLogsQuery({
        current: 1,
        size: 10,
        type: 'success',
      });

      const mockLoginLogs: LoginLogProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLoginLogs,
        0,
      ]);

      const result = await repository.pageLoginLogs(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysLoginLog',
        { type: 'success' },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ loginTime: 'DESC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询登录日志（同时按多个条件筛选）
     *
     * 验证当同时提供多个筛选条件时，能够正确构建复合查询条件。
     */
    it('应该成功分页查询登录日志（同时按多个条件筛选）', async () => {
      const query = new PageLoginLogsQuery({
        current: 2,
        size: 5,
        username: 'user',
        domain: 'example.com',
        address: '北京',
        type: 'success',
      });

      const mockLoginLogs: LoginLogProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLoginLogs,
        0,
      ]);

      const result = await repository.pageLoginLogs(query);

      expect(result.current).toBe(2);
      expect(result.size).toBe(5);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysLoginLog',
        {
          username: { $like: '%user%' },
          domain: 'example.com',
          address: { $like: '%北京%' },
          type: 'success',
        },
        expect.objectContaining({
          limit: 5,
          offset: 5, // (2 - 1) * 5
          orderBy: [{ loginTime: 'DESC' }],
        }),
      );
    });

    /**
     * 应该正确处理分页偏移量计算
     *
     * 验证分页偏移量的计算是否正确，确保不同页码的查询使用正确的 offset。
     */
    it('应该正确处理分页偏移量计算', async () => {
      const query = new PageLoginLogsQuery({
        current: 3,
        size: 20,
      });

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await repository.pageLoginLogs(query);

      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysLoginLog',
        {},
        expect.objectContaining({
          limit: 20,
          offset: 40, // (3 - 1) * 20
          orderBy: [{ loginTime: 'DESC' }],
        }),
      );
    });
  });
});

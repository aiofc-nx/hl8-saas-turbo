import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { ApiEndpoint } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/domain/api-endpoint.model';

import { ApiEndpointWriteRepository } from './api-endpoint.write.pg.repository';

/**
 * ApiEndpointWriteRepository 单元测试
 *
 * @description
 * 测试 API 端点写入仓储的实现，验证批量保存 API 端点的功能（包括更新、插入和删除）。
 */
describe('ApiEndpointWriteRepository', () => {
  let repository: ApiEndpointWriteRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      transactional: jest.fn(),
      find: jest.fn(),
      nativeDelete: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiEndpointWriteRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<ApiEndpointWriteRepository>(
      ApiEndpointWriteRepository,
    );
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

  describe('save', () => {
    /**
     * 应该成功保存 API 端点列表（全部为新端点）
     *
     * 验证当所有端点都是新端点时，能够正确创建并持久化。
     */
    it('应该成功保存 API 端点列表（全部为新端点）', async () => {
      const endpoints = [
        new ApiEndpoint(
          'endpoint-1',
          '/api/users',
          'GET',
          'read',
          'user',
          'UserController',
          '获取用户列表',
        ),
        new ApiEndpoint(
          'endpoint-2',
          '/api/users',
          'POST',
          'write',
          'user',
          'UserController',
          '创建用户',
        ),
      ];

      const mockEm = {
        find: jest.fn().mockResolvedValue([]),
        nativeDelete: jest.fn(),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue({}),
        persist: jest.fn(),
        flush: jest.fn().mockResolvedValue(undefined),
      };

      (entityManager.transactional as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockEm);
        },
      );

      await repository.save(endpoints);

      expect(entityManager.transactional).toHaveBeenCalledTimes(1);
      expect(mockEm.find).toHaveBeenCalledWith('SysEndpoint', {});
      expect(mockEm.nativeDelete).not.toHaveBeenCalled();
      expect(mockEm.create).toHaveBeenCalledTimes(2);
      expect(mockEm.flush).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该成功保存 API 端点列表（更新现有端点）
     *
     * 验证当端点已存在时，能够正确更新。
     */
    it('应该成功保存 API 端点列表（更新现有端点）', async () => {
      const endpoints = [
        new ApiEndpoint(
          'endpoint-1',
          '/api/users',
          'GET',
          'read',
          'user',
          'UserController',
          '获取用户列表',
        ),
      ];

      const existingEndpoint = {
        id: 'endpoint-1',
        path: '/api/users',
        method: 'GET',
      };

      const mockEm = {
        find: jest.fn().mockResolvedValue([existingEndpoint]),
        nativeDelete: jest.fn(),
        findOne: jest.fn().mockResolvedValue(existingEndpoint),
        nativeUpdate: jest.fn().mockResolvedValue(1),
        flush: jest.fn().mockResolvedValue(undefined),
      };

      (entityManager.transactional as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockEm);
        },
      );

      await repository.save(endpoints);

      expect(mockEm.findOne).toHaveBeenCalledWith('SysEndpoint', {
        id: 'endpoint-1',
      });
      expect(mockEm.nativeUpdate).toHaveBeenCalledWith(
        'SysEndpoint',
        { id: 'endpoint-1' },
        expect.objectContaining({
          path: '/api/users',
          method: 'GET',
          action: 'read',
          resource: 'user',
        }),
      );
    });

    /**
     * 应该成功删除不存在的端点
     *
     * 验证当新端点列表中不包含现有端点时，能够正确删除这些端点。
     */
    it('应该成功删除不存在的端点', async () => {
      const endpoints = [
        new ApiEndpoint(
          'endpoint-1',
          '/api/users',
          'GET',
          'read',
          'user',
          'UserController',
        ),
      ];

      const existingEndpoints = [
        { id: 'endpoint-1' },
        { id: 'endpoint-2' }, // 这个端点不在新列表中，应该被删除
        { id: 'endpoint-3' }, // 这个端点不在新列表中，应该被删除
      ];

      const mockEm = {
        find: jest.fn().mockResolvedValue(existingEndpoints),
        nativeDelete: jest.fn().mockResolvedValue(2),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue({}),
        persist: jest.fn(),
        flush: jest.fn().mockResolvedValue(undefined),
      };

      (entityManager.transactional as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockEm);
        },
      );

      await repository.save(endpoints);

      expect(mockEm.nativeDelete).toHaveBeenCalledWith('SysEndpoint', {
        id: { $in: ['endpoint-2', 'endpoint-3'] },
      });
    });

    /**
     * 应该正确处理空端点列表
     *
     * 验证当端点列表为空时，能够正确删除所有现有端点。
     */
    it('应该正确处理空端点列表', async () => {
      const endpoints: ApiEndpoint[] = [];

      const existingEndpoints = [{ id: 'endpoint-1' }, { id: 'endpoint-2' }];

      const mockEm = {
        find: jest.fn().mockResolvedValue(existingEndpoints),
        nativeDelete: jest.fn().mockResolvedValue(2),
        flush: jest.fn().mockResolvedValue(undefined),
      };

      (entityManager.transactional as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockEm);
        },
      );

      await repository.save(endpoints);

      expect(mockEm.nativeDelete).toHaveBeenCalledWith('SysEndpoint', {
        id: { $in: ['endpoint-1', 'endpoint-2'] },
      });
    });

    /**
     * 应该正确处理保存异常
     *
     * 验证当保存操作失败时，能够正确传播异常。
     */
    it('应该正确处理保存异常', async () => {
      const endpoints = [
        new ApiEndpoint(
          'endpoint-1',
          '/api/users',
          'GET',
          'read',
          'user',
          'UserController',
        ),
      ];

      const error = new Error('数据库保存失败');

      (entityManager.transactional as jest.Mock).mockRejectedValue(error);

      await expect(repository.save(endpoints)).rejects.toThrow(
        '数据库保存失败',
      );
    });

    /**
     * 应该使用默认值当字段缺失时
     *
     * 验证当端点的某些字段缺失时，能够使用默认值。
     */
    it('应该使用默认值当字段缺失时', async () => {
      const endpoint = new ApiEndpoint(
        'endpoint-1',
        '', // 空路径，应该使用默认值 '/'
        '', // 空方法，应该使用默认值 'GET'
        '', // 空操作
        '', // 空资源
        '', // 空控制器，应该使用 'UnknownController'
      );

      const mockEm = {
        find: jest.fn().mockResolvedValue([]),
        nativeDelete: jest.fn(),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue({}),
        persist: jest.fn(),
        flush: jest.fn().mockResolvedValue(undefined),
      };

      (entityManager.transactional as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockEm);
        },
      );

      await repository.save([endpoint]);

      expect(mockEm.create).toHaveBeenCalledWith(
        'SysEndpoint',
        expect.objectContaining({
          path: '/',
          method: 'GET',
          controller: 'UnknownController',
        }),
      );
    });
  });
});

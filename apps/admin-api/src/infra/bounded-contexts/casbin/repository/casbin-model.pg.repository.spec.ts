import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import {
  CasbinModelConfig,
  ModelConfigStatus,
} from '@/infra/entities/casbin-model-config.entity';

import { PaginationResult } from '@hl8/rest';

import { CasbinModelConfigProperties } from '@/lib/bounded-contexts/casbin/domain/casbin-model.model';
import { PageModelVersionsQuery } from '@/lib/bounded-contexts/casbin/queries/page-model-versions.query';

import {
  CasbinModelReadPostgresRepository,
  CasbinModelWritePostgresRepository,
} from './casbin-model.pg.repository';

/**
 * CasbinModelReadPostgresRepository 单元测试
 *
 * @description
 * 测试 Casbin 模型配置读取仓储的实现，验证分页查询、获取激活配置、根据 ID 查询和获取下一个版本号等功能。
 */
describe('CasbinModelReadPostgresRepository', () => {
  let repository: CasbinModelReadPostgresRepository;
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
      findOne: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasbinModelReadPostgresRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<CasbinModelReadPostgresRepository>(
      CasbinModelReadPostgresRepository,
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

  describe('pageModelVersions', () => {
    /**
     * 应该成功分页查询模型配置版本（无筛选条件）
     *
     * 验证当没有筛选条件时，能够正确返回分页结果。
     */
    it('应该成功分页查询模型配置版本（无筛选条件）', async () => {
      const query = new PageModelVersionsQuery({
        current: 1,
        size: 10,
      });

      const mockConfigs: CasbinModelConfig[] = [
        {
          id: 1,
          content: '[request_definition]\nr = sub, obj, act',
          version: 1,
          status: ModelConfigStatus.ACTIVE,
          remark: '初始版本',
          createdBy: 'user-1',
          createdAt: new Date(),
          approvedBy: 'admin-1',
          approvedAt: new Date(),
        } as CasbinModelConfig,
        {
          id: 2,
          content: '[request_definition]\nr = sub, obj, act, dom',
          version: 2,
          status: ModelConfigStatus.DRAFT,
          remark: '添加域支持',
          createdBy: 'user-1',
          createdAt: new Date(),
          approvedBy: null,
          approvedAt: null,
        } as CasbinModelConfig,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockConfigs,
        2,
      ]);

      const result = await repository.pageModelVersions(query);

      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.current).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(2);
      expect(result.records).toHaveLength(2);
      expect(result.records[0].id).toBe(1);
      expect(result.records[0].version).toBe(1);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        CasbinModelConfig,
        {},
        {
          limit: 10,
          offset: 0,
          orderBy: [{ version: 'DESC' }],
        },
      );
    });

    /**
     * 应该成功分页查询模型配置版本（按状态筛选）
     *
     * 验证当提供状态筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询模型配置版本（按状态筛选）', async () => {
      const query = new PageModelVersionsQuery({
        current: 1,
        size: 10,
        status: ModelConfigStatus.ACTIVE,
      });

      const mockConfigs: CasbinModelConfig[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockConfigs,
        0,
      ]);

      const result = await repository.pageModelVersions(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        CasbinModelConfig,
        { status: ModelConfigStatus.ACTIVE },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ version: 'DESC' }],
        }),
      );
    });
  });

  describe('getActiveModelConfig', () => {
    /**
     * 应该成功获取当前激活的模型配置
     *
     * 验证当存在激活的模型配置时，能够正确返回配置属性。
     */
    it('应该成功获取当前激活的模型配置', async () => {
      const mockConfig: CasbinModelConfig = {
        id: 1,
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.ACTIVE,
        remark: '激活版本',
        createdBy: 'user-1',
        createdAt: new Date(),
        approvedBy: 'admin-1',
        approvedAt: new Date(),
      } as CasbinModelConfig;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockConfig);

      const result = await repository.getActiveModelConfig();

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.status).toBe(ModelConfigStatus.ACTIVE);
      expect(result?.version).toBe(1);
      expect(entityManager.findOne).toHaveBeenCalledWith(CasbinModelConfig, {
        status: ModelConfigStatus.ACTIVE,
      });
    });

    /**
     * 应该返回 null 当没有激活的模型配置时
     *
     * 验证当不存在激活的模型配置时，方法返回 null。
     */
    it('应该返回 null 当没有激活的模型配置时', async () => {
      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.getActiveModelConfig();

      expect(result).toBeNull();
      expect(entityManager.findOne).toHaveBeenCalledWith(CasbinModelConfig, {
        status: ModelConfigStatus.ACTIVE,
      });
    });
  });

  describe('getModelConfigById', () => {
    /**
     * 应该成功根据 ID 获取模型配置
     *
     * 验证当模型配置存在时，能够正确返回配置属性。
     */
    it('应该成功根据 ID 获取模型配置', async () => {
      const configId = 1;
      const mockConfig: CasbinModelConfig = {
        id: configId,
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.DRAFT,
        remark: '草稿版本',
        createdBy: 'user-1',
        createdAt: new Date(),
        approvedBy: null,
        approvedAt: null,
      } as CasbinModelConfig;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockConfig);

      const result = await repository.getModelConfigById(configId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(configId);
      expect(result?.version).toBe(1);
      expect(result?.status).toBe(ModelConfigStatus.DRAFT);
      expect(entityManager.findOne).toHaveBeenCalledWith(CasbinModelConfig, {
        id: configId,
      });
    });

    /**
     * 应该返回 null 当模型配置不存在时
     *
     * 验证当模型配置不存在时，方法返回 null。
     */
    it('应该返回 null 当模型配置不存在时', async () => {
      const configId = 999;

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.getModelConfigById(configId);

      expect(result).toBeNull();
      expect(entityManager.findOne).toHaveBeenCalledWith(CasbinModelConfig, {
        id: configId,
      });
    });
  });

  describe('getNextVersion', () => {
    /**
     * 应该成功获取下一个版本号（当存在配置时）
     *
     * 验证当存在模型配置时，能够正确计算下一个版本号。
     */
    it('应该成功获取下一个版本号（当存在配置时）', async () => {
      const mockConfigs: CasbinModelConfig[] = [
        {
          id: 3,
          version: 3,
        } as CasbinModelConfig,
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockConfigs);

      const result = await repository.getNextVersion();

      expect(result).toBe(4);
      expect(entityManager.find).toHaveBeenCalledWith(
        CasbinModelConfig,
        {},
        {
          orderBy: { version: 'DESC' },
          limit: 1,
        },
      );
    });

    /**
     * 应该返回 1 当没有配置时
     *
     * 验证当不存在任何模型配置时，返回版本号 1。
     */
    it('应该返回 1 当没有配置时', async () => {
      (entityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.getNextVersion();

      expect(result).toBe(1);
      expect(entityManager.find).toHaveBeenCalledWith(
        CasbinModelConfig,
        {},
        {
          orderBy: { version: 'DESC' },
          limit: 1,
        },
      );
    });
  });
});

/**
 * CasbinModelWritePostgresRepository 单元测试
 *
 * @description
 * 测试 Casbin 模型配置写入仓储的实现，验证创建、更新模型配置和设置激活版本等功能。
 */
describe('CasbinModelWritePostgresRepository', () => {
  let repository: CasbinModelWritePostgresRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      create: jest.fn(),
      persistAndFlush: jest.fn(),
      findOne: jest.fn(),
      flush: jest.fn(),
      nativeUpdate: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasbinModelWritePostgresRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<CasbinModelWritePostgresRepository>(
      CasbinModelWritePostgresRepository,
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

  describe('createModelConfig', () => {
    /**
     * 应该成功创建模型配置
     *
     * 验证能够正确创建模型配置并返回创建后的属性。
     */
    it('应该成功创建模型配置', async () => {
      const config: Omit<CasbinModelConfigProperties, 'id'> = {
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.DRAFT,
        remark: '新配置',
        createdBy: 'user-1',
        createdAt: new Date(),
        approvedBy: null,
        approvedAt: null,
      };

      const mockConfig: CasbinModelConfig = {
        id: 1,
        ...config,
      } as CasbinModelConfig;

      (entityManager.create as jest.Mock).mockReturnValue(mockConfig);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.createModelConfig(config);

      expect(result.id).toBe(1);
      expect(result.version).toBe(1);
      expect(result.status).toBe(ModelConfigStatus.DRAFT);
      expect(result.content).toBe(config.content);
      expect(entityManager.create).toHaveBeenCalledWith(CasbinModelConfig, {
        content: config.content,
        version: config.version,
        status: config.status,
        remark: config.remark,
        createdBy: config.createdBy,
        createdAt: config.createdAt,
        approvedBy: config.approvedBy,
        approvedAt: config.approvedAt,
      });
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe('updateModelConfig', () => {
    /**
     * 应该成功更新模型配置
     *
     * 验证能够正确更新模型配置的字段并返回更新后的属性。
     */
    it('应该成功更新模型配置', async () => {
      const configId = 1;
      const mockConfig: CasbinModelConfig = {
        id: configId,
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.DRAFT,
        remark: '原始备注',
        createdBy: 'user-1',
        createdAt: new Date(),
        approvedBy: null,
        approvedAt: null,
      } as CasbinModelConfig;

      const updateData: Partial<CasbinModelConfigProperties> = {
        content: '[request_definition]\nr = sub, obj, act, dom',
        remark: '更新后的备注',
        status: ModelConfigStatus.ACTIVE,
      };

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockConfig);
      (entityManager.flush as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.updateModelConfig(configId, updateData);

      expect(result.id).toBe(configId);
      expect(result.content).toBe(updateData.content);
      expect(result.remark).toBe(updateData.remark);
      expect(result.status).toBe(updateData.status);
      expect(entityManager.findOne).toHaveBeenCalledWith(CasbinModelConfig, {
        id: configId,
      });
      expect(entityManager.flush).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当模型配置不存在时
     *
     * 验证当模型配置不存在时，方法抛出异常。
     */
    it('应该抛出异常当模型配置不存在时', async () => {
      const configId = 999;
      const updateData: Partial<CasbinModelConfigProperties> = {
        remark: '更新备注',
      };

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        repository.updateModelConfig(configId, updateData),
      ).rejects.toThrow(`Model config with id ${configId} not found`);
      expect(entityManager.flush).not.toHaveBeenCalled();
    });

    /**
     * 应该只更新提供的字段
     *
     * 验证只更新提供的字段，未提供的字段保持不变。
     */
    it('应该只更新提供的字段', async () => {
      const configId = 1;
      const mockConfig: CasbinModelConfig = {
        id: configId,
        content: '原始内容',
        version: 1,
        status: ModelConfigStatus.DRAFT,
        remark: '原始备注',
        createdBy: 'user-1',
        createdAt: new Date(),
        approvedBy: null,
        approvedAt: null,
      } as CasbinModelConfig;

      const updateData: Partial<CasbinModelConfigProperties> = {
        remark: '只更新备注',
      };

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockConfig);
      (entityManager.flush as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.updateModelConfig(configId, updateData);

      expect(result.content).toBe('原始内容');
      expect(result.remark).toBe('只更新备注');
      expect(result.status).toBe(ModelConfigStatus.DRAFT);
    });
  });

  describe('setActiveVersion', () => {
    /**
     * 应该成功设置激活版本
     *
     * 验证能够正确将所有其他版本设置为归档状态，并将指定版本设置为激活状态。
     */
    it('应该成功设置激活版本', async () => {
      const configId = 2;

      (entityManager.nativeUpdate as jest.Mock)
        .mockResolvedValueOnce(1) // 第一次调用：将 active 设置为 archived
        .mockResolvedValueOnce(1); // 第二次调用：将指定版本设置为 active

      const result = await repository.setActiveVersion(configId);

      expect(result).toBe(true);
      expect(entityManager.nativeUpdate).toHaveBeenCalledTimes(2);
      expect(entityManager.nativeUpdate).toHaveBeenNthCalledWith(
        1,
        CasbinModelConfig,
        { status: ModelConfigStatus.ACTIVE },
        { status: ModelConfigStatus.ARCHIVED },
      );
      expect(entityManager.nativeUpdate).toHaveBeenNthCalledWith(
        2,
        CasbinModelConfig,
        { id: configId },
        expect.objectContaining({
          status: ModelConfigStatus.ACTIVE,
        }),
      );
    });

    /**
     * 应该返回 false 当配置不存在时
     *
     * 验证当指定的配置不存在时，方法返回 false。
     */
    it('应该返回 false 当配置不存在时', async () => {
      const configId = 999;

      (entityManager.nativeUpdate as jest.Mock)
        .mockResolvedValueOnce(1) // 第一次调用：将 active 设置为 archived
        .mockResolvedValueOnce(0); // 第二次调用：没有找到配置

      const result = await repository.setActiveVersion(configId);

      expect(result).toBe(false);
      expect(entityManager.nativeUpdate).toHaveBeenCalledTimes(2);
    });
  });
});

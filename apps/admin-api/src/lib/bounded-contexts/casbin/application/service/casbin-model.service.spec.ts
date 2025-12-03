import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ModelConfigStatus } from '@/infra/entities/casbin-model-config.entity';

import {
  CasbinModelReadRepoPortToken,
  CasbinModelWriteRepoPortToken,
} from '../../constants';
import { CasbinModelConfigProperties } from '../../domain/casbin-model.model';
import type {
  CasbinModelReadRepoPort,
  CasbinModelWriteRepoPort,
} from '../../ports/casbin-model.repo-port';
import { CasbinModelService } from './casbin-model.service';

/**
 * CasbinModelService 单元测试
 *
 * @description
 * 测试 Casbin 模型配置服务的业务逻辑。
 */
describe('CasbinModelService', () => {
  let service: CasbinModelService;
  let readRepo: jest.Mocked<CasbinModelReadRepoPort>;
  let writeRepo: jest.Mocked<CasbinModelWriteRepoPort>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockReadRepo: CasbinModelReadRepoPort = {
      pageModelVersions: jest.fn(),
      getModelConfigById: jest.fn(),
      getNextVersion: jest.fn().mockResolvedValue(1),
      getActiveModelConfig: jest.fn(),
    } as unknown as jest.Mocked<CasbinModelReadRepoPort>;

    const mockWriteRepo: CasbinModelWriteRepoPort = {
      createModelConfig: jest.fn(),
      updateModelConfig: jest.fn(),
      setActiveVersion: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<CasbinModelWriteRepoPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasbinModelService,
        {
          provide: CasbinModelReadRepoPortToken,
          useValue: mockReadRepo,
        },
        {
          provide: CasbinModelWriteRepoPortToken,
          useValue: mockWriteRepo,
        },
      ],
    }).compile();

    service = module.get<CasbinModelService>(CasbinModelService);
    readRepo = module.get(CasbinModelReadRepoPortToken);
    writeRepo = module.get(CasbinModelWriteRepoPortToken);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateModelContent', () => {
    /**
     * 应该通过验证当模型配置内容有效时
     *
     * 验证当提供有效的模型配置内容时，服务能够通过验证。
     */
    it('应该通过验证当模型配置内容有效时', async () => {
      const content = `[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act`;

      await expect(
        service.validateModelContent(content),
      ).resolves.not.toThrow();
    });

    /**
     * 应该抛出异常当缺少必备段落时
     *
     * 验证当模型配置缺少必备段落时，服务能够正确抛出异常。
     */
    it('应该抛出异常当缺少必备段落时', async () => {
      const content = '[request_definition]\nr = sub, obj, act';
      // 缺少 [policy_definition] 和 [matchers]

      await expect(service.validateModelContent(content)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateModelContent(content)).rejects.toThrow(
        '模型配置缺少必备段落',
      );
    });

    /**
     * 应该抛出异常当模型配置内容无效时
     *
     * 验证当模型配置内容无法被 Casbin 解析时，服务能够正确抛出异常。
     */
    it('应该抛出异常当模型配置内容无效时', async () => {
      const content = `[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[matchers]
m = invalid syntax here!!!`;

      await expect(service.validateModelContent(content)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateModelContent(content)).rejects.toThrow(
        '模型配置内容无效',
      );
    });
  });

  describe('createDraft', () => {
    /**
     * 应该成功创建模型配置草稿
     *
     * 验证当提供有效的参数时，服务能够正确创建草稿。
     */
    it('应该成功创建模型配置草稿', async () => {
      const content = `[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act`;
      const remark = '新草稿';
      const createdBy = 'user-123';

      const mockResult: CasbinModelConfigProperties = {
        id: 1,
        content,
        version: 1,
        status: ModelConfigStatus.DRAFT,
        remark,
        createdBy,
        createdAt: new Date(),
        approvedBy: undefined,
        approvedAt: undefined,
      };

      (writeRepo.createModelConfig as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.createDraft(content, remark, createdBy);

      expect(result).toEqual(mockResult);
      expect(readRepo.getNextVersion).toHaveBeenCalledTimes(1);
      expect(writeRepo.createModelConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          content,
          version: 1,
          status: ModelConfigStatus.DRAFT,
          remark,
          createdBy,
        }),
      );
    });

    /**
     * 应该先校验模型配置内容
     *
     * 验证创建草稿前，服务会先校验模型配置内容。
     */
    it('应该先校验模型配置内容', async () => {
      const content = `[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act`;
      const remark = '新草稿';
      const createdBy = 'user-123';

      const mockResult: CasbinModelConfigProperties = {
        id: 1,
        content,
        version: 1,
        status: ModelConfigStatus.DRAFT,
        remark,
        createdBy,
        createdAt: new Date(),
        approvedBy: undefined,
        approvedAt: undefined,
      };

      (writeRepo.createModelConfig as jest.Mock).mockResolvedValue(mockResult);

      await service.createDraft(content, remark, createdBy);

      // 验证 validateModelContent 被调用（通过 createModelConfig 被调用来间接验证）
      expect(writeRepo.createModelConfig).toHaveBeenCalled();
    });
  });

  describe('updateDraft', () => {
    /**
     * 应该成功更新模型配置草稿
     *
     * 验证当提供有效的参数时，服务能够正确更新草稿。
     */
    it('应该成功更新模型配置草稿', async () => {
      const id = 1;
      const content = `[request_definition]
r = sub, obj, act, domain

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act`;
      const remark = '更新后的草稿';

      const existingDraft: CasbinModelConfigProperties = {
        id,
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.DRAFT,
        remark: '原草稿',
        createdBy: 'user-123',
        createdAt: new Date(),
        approvedBy: undefined,
        approvedAt: undefined,
      };

      const updatedDraft: CasbinModelConfigProperties = {
        ...existingDraft,
        content,
        remark,
      };

      (readRepo.getModelConfigById as jest.Mock).mockResolvedValue(
        existingDraft,
      );
      (writeRepo.updateModelConfig as jest.Mock).mockResolvedValue(
        updatedDraft,
      );

      const result = await service.updateDraft(id, content, remark);

      expect(result).toEqual(updatedDraft);
      expect(readRepo.getModelConfigById).toHaveBeenCalledWith(id);
      expect(writeRepo.updateModelConfig).toHaveBeenCalledWith(id, {
        content,
        remark,
      });
    });

    /**
     * 应该抛出异常当草稿不存在时
     *
     * 验证当草稿不存在时，服务能够正确抛出异常。
     */
    it('应该抛出异常当草稿不存在时', async () => {
      const id = 999;
      const content = '[request_definition]\nr = sub, obj, act';
      const remark = '更新后的草稿';

      (readRepo.getModelConfigById as jest.Mock).mockResolvedValue(null);

      await expect(service.updateDraft(id, content, remark)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateDraft(id, content, remark)).rejects.toThrow(
        '草稿版本 999 不存在',
      );
    });

    /**
     * 应该抛出异常当版本不是草稿状态时
     *
     * 验证当版本不是草稿状态时，服务能够正确抛出异常。
     */
    it('应该抛出异常当版本不是草稿状态时', async () => {
      const id = 1;
      const content = '[request_definition]\nr = sub, obj, act';
      const remark = '更新后的草稿';

      const existingVersion: CasbinModelConfigProperties = {
        id,
        content,
        version: 1,
        status: ModelConfigStatus.ACTIVE, // 不是草稿状态
        remark: '已激活版本',
        createdBy: 'user-123',
        createdAt: new Date(),
        approvedBy: 'user-123',
        approvedAt: new Date(),
      };

      (readRepo.getModelConfigById as jest.Mock).mockResolvedValue(
        existingVersion,
      );

      await expect(service.updateDraft(id, content, remark)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateDraft(id, content, remark)).rejects.toThrow(
        '版本 1 不是草稿状态，无法更新',
      );
    });
  });

  describe('publishVersion', () => {
    /**
     * 应该成功发布模型配置版本
     *
     * 验证当提供有效的参数时，服务能够正确发布版本。
     */
    it('应该成功发布模型配置版本', async () => {
      const id = 1;
      const approvedBy = 'user-123';

      const existingVersion: CasbinModelConfigProperties = {
        id,
        content: `[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act`,
        version: 1,
        status: ModelConfigStatus.DRAFT,
        remark: '草稿版本',
        createdBy: 'user-123',
        createdAt: new Date(),
        approvedBy: undefined,
        approvedAt: undefined,
      };

      (readRepo.getModelConfigById as jest.Mock).mockResolvedValue(
        existingVersion,
      );
      (writeRepo.setActiveVersion as jest.Mock).mockResolvedValue(true);
      (writeRepo.updateModelConfig as jest.Mock).mockResolvedValue({
        ...existingVersion,
        approvedBy,
        approvedAt: expect.any(Date),
      });

      const result = await service.publishVersion(id, approvedBy);

      expect(result).toBe(true);
      expect(readRepo.getModelConfigById).toHaveBeenCalledWith(id);
      expect(writeRepo.setActiveVersion).toHaveBeenCalledWith(id);
      expect(writeRepo.updateModelConfig).toHaveBeenCalledWith(id, {
        approvedBy,
        approvedAt: expect.any(Date),
      });
    });

    /**
     * 应该抛出异常当版本不存在时
     *
     * 验证当版本不存在时，服务能够正确抛出异常。
     */
    it('应该抛出异常当版本不存在时', async () => {
      const id = 999;
      const approvedBy = 'user-123';

      (readRepo.getModelConfigById as jest.Mock).mockResolvedValue(null);

      await expect(service.publishVersion(id, approvedBy)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.publishVersion(id, approvedBy)).rejects.toThrow(
        '版本 999 不存在',
      );
    });
  });

  describe('rollbackVersion', () => {
    /**
     * 应该成功回滚模型配置版本
     *
     * 验证当提供有效的参数时，服务能够正确回滚版本。
     */
    it('应该成功回滚模型配置版本', async () => {
      const id = 1;
      const approvedBy = 'user-123';

      const existingVersion: CasbinModelConfigProperties = {
        id,
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.ARCHIVED,
        remark: '历史版本',
        createdBy: 'user-123',
        createdAt: new Date(),
        approvedBy: 'user-123',
        approvedAt: new Date(),
      };

      (readRepo.getModelConfigById as jest.Mock).mockResolvedValue(
        existingVersion,
      );
      (writeRepo.setActiveVersion as jest.Mock).mockResolvedValue(true);
      (writeRepo.updateModelConfig as jest.Mock).mockResolvedValue({
        ...existingVersion,
        approvedBy,
        approvedAt: expect.any(Date),
      });

      const result = await service.rollbackVersion(id, approvedBy);

      expect(result).toBe(true);
      expect(readRepo.getModelConfigById).toHaveBeenCalledWith(id);
      expect(writeRepo.setActiveVersion).toHaveBeenCalledWith(id);
      expect(writeRepo.updateModelConfig).toHaveBeenCalledWith(id, {
        approvedBy,
        approvedAt: expect.any(Date),
      });
    });

    /**
     * 应该抛出异常当版本不存在时
     *
     * 验证当版本不存在时，服务能够正确抛出异常。
     */
    it('应该抛出异常当版本不存在时', async () => {
      const id = 999;
      const approvedBy = 'user-123';

      (readRepo.getModelConfigById as jest.Mock).mockResolvedValue(null);

      await expect(service.rollbackVersion(id, approvedBy)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.rollbackVersion(id, approvedBy)).rejects.toThrow(
        '版本 999 不存在',
      );
    });
  });

  describe('getActiveModelContent', () => {
    /**
     * 应该成功获取激活版本的模型配置内容
     *
     * 验证当存在激活版本时，服务能够正确返回模型配置内容。
     */
    it('应该成功获取激活版本的模型配置内容', async () => {
      const activeConfig: CasbinModelConfigProperties = {
        id: 1,
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.ACTIVE,
        remark: '激活版本',
        createdBy: 'user-123',
        createdAt: new Date(),
        approvedBy: 'user-123',
        approvedAt: new Date(),
      };

      (readRepo.getActiveModelConfig as jest.Mock).mockResolvedValue(
        activeConfig,
      );

      const result = await service.getActiveModelContent();

      expect(result).toBe('[request_definition]\nr = sub, obj, act');
      expect(readRepo.getActiveModelConfig).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回 null 当没有激活版本时
     *
     * 验证当没有激活版本时，服务能够正确返回 null。
     */
    it('应该返回 null 当没有激活版本时', async () => {
      (readRepo.getActiveModelConfig as jest.Mock).mockResolvedValue(null);

      const result = await service.getActiveModelContent();

      expect(result).toBeNull();
      expect(readRepo.getActiveModelConfig).toHaveBeenCalledTimes(1);
    });
  });
});

import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { ModelConfigStatus } from '@/infra/entities/casbin-model-config.entity';
import { ModelDraftCreateCommand } from '@/lib/bounded-contexts/casbin/commands/model-draft-create.command';
import { ModelDraftUpdateCommand } from '@/lib/bounded-contexts/casbin/commands/model-draft-update.command';
import { ModelPublishCommand } from '@/lib/bounded-contexts/casbin/commands/model-publish.command';
import { ModelRollbackCommand } from '@/lib/bounded-contexts/casbin/commands/model-rollback.command';
import {
  CasbinModelConfigProperties,
  ModelVersionDiffDto,
} from '@/lib/bounded-contexts/casbin/domain/casbin-model.model';
import { ModelVersionDetailQuery } from '@/lib/bounded-contexts/casbin/queries/model-version-detail.query';
import { ModelVersionDiffQuery } from '@/lib/bounded-contexts/casbin/queries/model-version-diff.query';
import { PageModelVersionsQuery } from '@/lib/bounded-contexts/casbin/queries/page-model-versions.query';

import { AuthZGuard } from '@hl8/casbin';
import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import {
  ModelDraftCreateDto,
  ModelDraftUpdateDto,
} from '../dto/model-config.dto';
import { PageModelVersionsDto } from '../dto/page-model-versions.dto';
import { CasbinModelController } from './casbin-model.controller';

/**
 * CasbinModelController 单元测试
 *
 * @description
 * 测试 Casbin 模型配置控制器的实现，验证分页查询、创建、更新、发布和回滚模型配置的功能。
 */
describe('CasbinModelController', () => {
  let controller: CasbinModelController;
  let queryBus: jest.Mocked<QueryBus>;
  let commandBus: jest.Mocked<CommandBus>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock QueryBus 和 CommandBus 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock QueryBus 和 CommandBus
    const mockQueryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    const mockCommandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CasbinModelController],
      providers: [
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
      ],
    })
      .overrideGuard(AuthZGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<CasbinModelController>(CasbinModelController);
    queryBus = module.get(QueryBus);
    commandBus = module.get(CommandBus);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('pageVersions', () => {
    /**
     * 应该成功分页查询模型配置版本列表
     *
     * 验证能够正确执行分页查询并返回结果，包括 DTO 转换。
     */
    it('应该成功分页查询模型配置版本列表', async () => {
      const queryDto = new PageModelVersionsDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.status = ModelConfigStatus.ACTIVE;

      const mockConfig: CasbinModelConfigProperties = {
        id: 1,
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.ACTIVE,
        remark: '初始版本',
        createdBy: 'user-1',
        createdAt: new Date(),
        approvedBy: 'user-1',
        approvedAt: new Date(),
      };

      const mockResult = new PaginationResult<CasbinModelConfigProperties>(
        1,
        10,
        1,
        [mockConfig],
      );

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.pageVersions(queryDto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeInstanceOf(PaginationResult);
      expect(result.data?.records).toHaveLength(1);
      expect(result.data?.records[0]).toBeInstanceOf(Object);
      expect(result.data?.records[0].id).toBe(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PageModelVersionsQuery),
      );
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当查询失败时，能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const queryDto = new PageModelVersionsDto();
      queryDto.current = 1;
      queryDto.size = 10;

      const error = new Error('查询失败');
      (queryBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.pageVersions(queryDto)).rejects.toThrow(
        '查询失败',
      );
    });
  });

  describe('getActive', () => {
    /**
     * 应该成功获取当前激活的模型配置
     *
     * 验证能够正确获取激活状态的模型配置。
     */
    it('应该成功获取当前激活的模型配置', async () => {
      const mockConfig: CasbinModelConfigProperties = {
        id: 1,
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.ACTIVE,
        remark: '激活版本',
        createdBy: 'user-1',
        createdAt: new Date(),
        approvedBy: 'user-1',
        approvedAt: new Date(),
      };

      const mockResult = new PaginationResult<CasbinModelConfigProperties>(
        1,
        1,
        1,
        [mockConfig],
      );

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getActive();

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeInstanceOf(Object);
      expect(result.data?.id).toBe(1);
      expect(result.data?.status).toBe(ModelConfigStatus.ACTIVE);
    });

    /**
     * 应该返回 null 当没有激活的模型配置时
     *
     * 验证当没有激活的模型配置时，能够正确返回 null。
     */
    it('应该返回 null 当没有激活的模型配置时', async () => {
      const mockResult = new PaginationResult<CasbinModelConfigProperties>(
        1,
        1,
        0,
        [],
      );

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getActive();

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });
  });

  describe('getVersionDetail', () => {
    /**
     * 应该成功获取版本详情
     *
     * 验证能够正确获取指定版本的模型配置详情。
     */
    it('应该成功获取版本详情', async () => {
      const versionId = 1;

      const mockConfig: CasbinModelConfigProperties = {
        id: 1,
        content: '[request_definition]\nr = sub, obj, act',
        version: 1,
        status: ModelConfigStatus.DRAFT,
        remark: '草稿版本',
        createdBy: 'user-1',
        createdAt: new Date(),
        approvedBy: null,
        approvedAt: null,
      };

      (queryBus.execute as jest.Mock).mockResolvedValue(mockConfig);

      const result = await controller.getVersionDetail(versionId);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeInstanceOf(Object);
      expect(result.data?.id).toBe(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(ModelVersionDetailQuery),
      );
    });

    /**
     * 应该返回 null 当版本不存在时
     *
     * 验证当版本不存在时，能够正确返回 null。
     */
    it('应该返回 null 当版本不存在时', async () => {
      const versionId = 999;

      (queryBus.execute as jest.Mock).mockResolvedValue(null);

      const result = await controller.getVersionDetail(versionId);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });
  });

  describe('getVersionDiff', () => {
    /**
     * 应该成功获取版本差异
     *
     * 验证能够正确获取两个版本之间的差异内容。
     */
    it('应该成功获取版本差异', async () => {
      const sourceId = 1;
      const targetId = 2;

      const mockDiff: ModelVersionDiffDto = {
        source: {
          id: 1,
          content: '[request_definition]\nr = sub, obj, act',
          version: 1,
        },
        target: {
          id: 2,
          content: '[request_definition]\nr = sub, obj, act, domain',
          version: 2,
        },
        diff: '--- version 1\n+++ version 2\n...',
      };

      (queryBus.execute as jest.Mock).mockResolvedValue(mockDiff);

      const result = await controller.getVersionDiff(sourceId, targetId);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockDiff);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(ModelVersionDiffQuery),
      );
    });
  });

  describe('createDraft', () => {
    /**
     * 应该成功创建模型配置草稿
     *
     * 验证能够正确执行创建草稿命令并返回成功结果。
     */
    it('应该成功创建模型配置草稿', async () => {
      const dto = new ModelDraftCreateDto();
      dto.content = '[request_definition]\nr = sub, obj, act';
      dto.remark = '新草稿';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.createDraft(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ModelDraftCreateCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(ModelDraftCreateCommand);
      expect(command.content).toBe('[request_definition]\nr = sub, obj, act');
    });

    /**
     * 应该正确处理创建异常
     *
     * 验证当创建失败时，能够正确传播异常。
     */
    it('应该正确处理创建异常', async () => {
      const dto = new ModelDraftCreateDto();
      dto.content = '[request_definition]\nr = sub, obj, act';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('创建失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.createDraft(dto, mockRequest)).rejects.toThrow(
        '创建失败',
      );
    });
  });

  describe('updateDraft', () => {
    /**
     * 应该成功更新模型配置草稿
     *
     * 验证能够正确执行更新草稿命令并返回成功结果。
     */
    it('应该成功更新模型配置草稿', async () => {
      const id = 1;
      const dto = new ModelDraftUpdateDto();
      dto.content = '[request_definition]\nr = sub, obj, act, domain';
      dto.remark = '更新后的草稿';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.updateDraft(id, dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ModelDraftUpdateCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(ModelDraftUpdateCommand);
      expect(command.id).toBe(id);
    });
  });

  describe('publish', () => {
    /**
     * 应该成功发布模型配置
     *
     * 验证能够正确执行发布命令并返回成功结果。
     */
    it('应该成功发布模型配置', async () => {
      const versionId = 1;

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.publishVersion(versionId, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ModelPublishCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(ModelPublishCommand);
      expect(command.id).toBe(1);
    });
  });

  describe('rollback', () => {
    /**
     * 应该成功回滚模型配置
     *
     * 验证能够正确执行回滚命令并返回成功结果。
     */
    it('应该成功回滚模型配置', async () => {
      const versionId = 1;

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.rollbackVersion(versionId, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ModelRollbackCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(ModelRollbackCommand);
      expect(command.id).toBe(1);
    });
  });
});

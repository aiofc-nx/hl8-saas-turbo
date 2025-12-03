import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { PolicyBatchCommand } from '@/lib/bounded-contexts/casbin/commands/policy-batch.command';
import { PolicyCreateCommand } from '@/lib/bounded-contexts/casbin/commands/policy-create.command';
import { PolicyDeleteCommand } from '@/lib/bounded-contexts/casbin/commands/policy-delete.command';
import {
  PolicyRuleDto,
  PolicyRuleProperties,
} from '@/lib/bounded-contexts/casbin/domain/policy-rule.model';
import { PagePoliciesQuery } from '@/lib/bounded-contexts/casbin/queries/page-policies.query';

import { AuthZGuard } from '@hl8/casbin';
import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { PagePoliciesDto } from '../dto/page-policies.dto';
import { PolicyBatchDto, PolicyRuleCreateDto } from '../dto/policy-rule.dto';
import { CasbinPolicyController } from './casbin-policy.controller';

/**
 * CasbinPolicyController 单元测试
 *
 * @description
 * 测试 Casbin 策略规则控制器的实现，验证分页查询、创建、删除和批量操作策略规则的功能。
 */
describe('CasbinPolicyController', () => {
  let controller: CasbinPolicyController;
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
      controllers: [CasbinPolicyController],
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

    controller = module.get<CasbinPolicyController>(CasbinPolicyController);
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

  describe('page', () => {
    /**
     * 应该成功分页查询策略规则列表
     *
     * 验证能够正确执行分页查询并返回结果，包括 DTO 转换。
     */
    it('应该成功分页查询策略规则列表', async () => {
      const queryDto = new PagePoliciesDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.ptype = 'p';
      queryDto.subject = 'admin';
      queryDto.object = '/api/users';
      queryDto.action = 'GET';
      queryDto.domain = 'example.com';

      const mockPolicyRule: PolicyRuleProperties = {
        id: 'policy-1',
        ptype: 'p',
        v0: 'admin',
        v1: '/api/users',
        v2: 'GET',
        v3: 'example.com',
        v4: null,
        v5: null,
      };

      const mockResult = new PaginationResult<PolicyRuleProperties>(1, 10, 1, [
        mockPolicyRule,
      ]);

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.page(queryDto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeInstanceOf(PaginationResult);
      expect(result.data?.records).toHaveLength(1);
      expect(result.data?.records[0]).toBeInstanceOf(PolicyRuleDto);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PagePoliciesQuery),
      );
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当查询失败时，能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const queryDto = new PagePoliciesDto();
      queryDto.current = 1;
      queryDto.size = 10;

      const error = new Error('查询失败');
      (queryBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.page(queryDto)).rejects.toThrow('查询失败');
    });
  });

  describe('create', () => {
    /**
     * 应该成功创建策略规则
     *
     * 验证能够正确执行创建策略规则命令并返回成功结果。
     */
    it('应该成功创建策略规则', async () => {
      const dto = new PolicyRuleCreateDto();
      dto.ptype = 'p';
      dto.subject = 'admin';
      dto.object = '/api/users';
      dto.action = 'GET';
      dto.domain = 'example.com';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.createPolicy(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(PolicyCreateCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(PolicyCreateCommand);
      expect(command.policy.ptype).toBe('p');
      expect(command.policy.subject).toBe('admin');
    });

    /**
     * 应该正确处理创建异常
     *
     * 验证当创建失败时，能够正确传播异常。
     */
    it('应该正确处理创建异常', async () => {
      const dto = new PolicyRuleCreateDto();
      dto.ptype = 'p';
      dto.subject = 'admin';
      dto.object = '/api/users';
      dto.action = 'GET';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('创建失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.createPolicy(dto, mockRequest)).rejects.toThrow(
        '创建失败',
      );
    });
  });

  describe('delete', () => {
    /**
     * 应该成功删除策略规则
     *
     * 验证能够正确执行删除策略规则命令并返回成功结果。
     */
    it('应该成功删除策略规则', async () => {
      const policyId = 123;
      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deletePolicy(policyId, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(PolicyDeleteCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(PolicyDeleteCommand);
      expect(command.id).toBe(policyId);
    });

    /**
     * 应该正确处理删除异常
     *
     * 验证当删除失败时，能够正确传播异常。
     */
    it('应该正确处理删除异常', async () => {
      const policyId = 123;
      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('删除失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.deletePolicy(policyId, mockRequest),
      ).rejects.toThrow('删除失败');
    });
  });

  describe('batch', () => {
    /**
     * 应该成功批量操作策略规则
     *
     * 验证能够正确执行批量操作命令并返回成功结果。
     */
    it('应该成功批量操作策略规则', async () => {
      const dto = new PolicyBatchDto();
      dto.policies = [
        {
          ptype: 'p',
          subject: 'admin',
          object: '/api/users',
          action: 'GET',
          domain: 'example.com',
        },
      ];
      dto.operation = 'add';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.batchOperations(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(PolicyBatchCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(PolicyBatchCommand);
      expect(command.policies).toHaveLength(1);
      expect(command.operation).toBe('add');
    });

    /**
     * 应该正确处理批量操作异常
     *
     * 验证当批量操作失败时，能够正确传播异常。
     */
    it('应该正确处理批量操作异常', async () => {
      const dto = new PolicyBatchDto();
      dto.policies = [];
      dto.operation = 'delete';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('批量操作失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.batchOperations(dto, mockRequest),
      ).rejects.toThrow('批量操作失败');
    });
  });
});

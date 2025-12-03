import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { RelationCreateCommand } from '@/lib/bounded-contexts/casbin/commands/relation-create.command';
import { RelationDeleteCommand } from '@/lib/bounded-contexts/casbin/commands/relation-delete.command';
import {
  RoleRelationDto,
  RoleRelationProperties,
} from '@/lib/bounded-contexts/casbin/domain/policy-rule.model';
import { PageRelationsQuery } from '@/lib/bounded-contexts/casbin/queries/page-relations.query';

import { AuthZGuard } from '@hl8/casbin';
import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { PageRelationsDto } from '../dto/page-relations.dto';
import { RoleRelationCreateDto } from '../dto/role-relation.dto';
import { CasbinRelationController } from './casbin-relation.controller';

/**
 * CasbinRelationController 单元测试
 *
 * @description
 * 测试 Casbin 角色继承关系控制器的实现，验证分页查询、创建和删除角色继承关系的功能。
 */
describe('CasbinRelationController', () => {
  let controller: CasbinRelationController;
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
      controllers: [CasbinRelationController],
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

    controller = module.get<CasbinRelationController>(CasbinRelationController);
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
     * 应该成功分页查询角色继承关系列表
     *
     * 验证能够正确执行分页查询并返回结果，包括 DTO 转换。
     */
    it('应该成功分页查询角色继承关系列表', async () => {
      const queryDto = new PageRelationsDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.childSubject = 'user-123';
      queryDto.parentRole = 'admin';
      queryDto.domain = 'example.com';

      const mockRelation: RoleRelationProperties = {
        id: 'relation-1',
        v0: 'user-123',
        v1: 'admin',
        v2: 'example.com',
      };

      const mockResult = new PaginationResult<RoleRelationProperties>(
        1,
        10,
        1,
        [mockRelation],
      );

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.page(queryDto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeInstanceOf(PaginationResult);
      expect(result.data?.records).toHaveLength(1);
      expect(result.data?.records[0]).toBeInstanceOf(RoleRelationDto);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PageRelationsQuery),
      );
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当查询失败时，能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const queryDto = new PageRelationsDto();
      queryDto.current = 1;
      queryDto.size = 10;

      const error = new Error('查询失败');
      (queryBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.page(queryDto)).rejects.toThrow('查询失败');
    });
  });

  describe('create', () => {
    /**
     * 应该成功创建角色继承关系
     *
     * 验证能够正确执行创建角色继承关系命令并返回成功结果。
     */
    it('应该成功创建角色继承关系', async () => {
      const dto = new RoleRelationCreateDto();
      dto.childSubject = 'user-123';
      dto.parentRole = 'admin';
      dto.domain = 'example.com';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.createRelation(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RelationCreateCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(RelationCreateCommand);
      expect(command.relation.childSubject).toBe('user-123');
      expect(command.relation.parentRole).toBe('admin');
    });

    /**
     * 应该正确处理创建异常
     *
     * 验证当创建失败时，能够正确传播异常。
     */
    it('应该正确处理创建异常', async () => {
      const dto = new RoleRelationCreateDto();
      dto.childSubject = 'user-123';
      dto.parentRole = 'admin';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('创建失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.createRelation(dto, mockRequest)).rejects.toThrow(
        '创建失败',
      );
    });
  });

  describe('delete', () => {
    /**
     * 应该成功删除角色继承关系
     *
     * 验证能够正确执行删除角色继承关系命令并返回成功结果。
     */
    it('应该成功删除角色继承关系', async () => {
      const relationId = 123;
      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deleteRelation(relationId, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RelationDeleteCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(RelationDeleteCommand);
      expect(command.id).toBe(123);
    });

    /**
     * 应该正确处理删除异常
     *
     * 验证当删除失败时，能够正确传播异常。
     */
    it('应该正确处理删除异常', async () => {
      const relationId = 123;
      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('删除失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.deleteRelation(relationId, mockRequest),
      ).rejects.toThrow('删除失败');
    });
  });
});

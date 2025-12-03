import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { DomainCreateCommand } from '@/lib/bounded-contexts/iam/domain/commands/domain-create.command';
import { DomainDeleteCommand } from '@/lib/bounded-contexts/iam/domain/commands/domain-delete.command';
import { DomainUpdateCommand } from '@/lib/bounded-contexts/iam/domain/commands/domain-update.command';
import { DomainProperties } from '@/lib/bounded-contexts/iam/domain/domain/domain.read.model';
import { PageDomainsQuery } from '@/lib/bounded-contexts/iam/domain/queries/page-domains.query';
import { Status } from '@/lib/shared/enums/status.enum';

import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { DomainCreateDto, DomainUpdateDto } from '../dto/domain.dto';
import { PageDomainsDto } from '../dto/page-domains.dto';
import { DomainController } from './domain.controller';

/**
 * DomainController 单元测试
 *
 * @description
 * 测试域控制器的实现，验证分页查询、创建、更新和删除域的功能。
 */
describe('DomainController', () => {
  let controller: DomainController;
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
      controllers: [DomainController],
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
    }).compile();

    controller = module.get<DomainController>(DomainController);
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
     * 应该成功分页查询域列表
     *
     * 验证能够正确执行分页查询并返回结果。
     */
    it('应该成功分页查询域列表', async () => {
      const queryDto = new PageDomainsDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.name = '测试';
      queryDto.status = Status.ENABLED;

      const mockResult = new PaginationResult<DomainProperties>(1, 10, 2, [
        {
          id: 'domain-1',
          code: 'example1',
          name: '示例域1',
          status: Status.ENABLED,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as DomainProperties,
        {
          id: 'domain-2',
          code: 'example2',
          name: '示例域2',
          status: Status.ENABLED,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as DomainProperties,
      ]);

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.page(queryDto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PageDomainsQuery),
      );
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当查询失败时，能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const queryDto = new PageDomainsDto();
      queryDto.current = 1;
      queryDto.size = 10;

      const error = new Error('查询失败');
      (queryBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.page(queryDto)).rejects.toThrow('查询失败');
    });
  });

  describe('createDomain', () => {
    /**
     * 应该成功创建域
     *
     * 验证能够正确执行创建域命令并返回成功结果。
     */
    it('应该成功创建域', async () => {
      const dto = new DomainCreateDto();
      dto.code = 'newdomain';
      dto.name = '新域';
      dto.description = '新域描述';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.createDomain(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DomainCreateCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(DomainCreateCommand);
      expect(command.code).toBe('newdomain');
      expect(command.name).toBe('新域');
    });

    /**
     * 应该正确处理创建异常
     *
     * 验证当创建失败时，能够正确传播异常。
     */
    it('应该正确处理创建异常', async () => {
      const dto = new DomainCreateDto();
      dto.code = 'newdomain';
      dto.name = '新域';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('创建失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.createDomain(dto, mockRequest)).rejects.toThrow(
        '创建失败',
      );
    });
  });

  describe('updateDomain', () => {
    /**
     * 应该成功更新域
     *
     * 验证能够正确执行更新域命令并返回成功结果。
     */
    it('应该成功更新域', async () => {
      const dto = new DomainUpdateDto();
      dto.id = 'domain-123';
      dto.code = 'example';
      dto.name = '更新后的域名';
      dto.description = '更新后的描述';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.updateDomain(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DomainUpdateCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(DomainUpdateCommand);
      expect(command.id).toBe('domain-123');
      expect(command.name).toBe('更新后的域名');
    });

    /**
     * 应该正确处理更新异常
     *
     * 验证当更新失败时，能够正确传播异常。
     */
    it('应该正确处理更新异常', async () => {
      const dto = new DomainUpdateDto();
      dto.id = 'domain-123';
      dto.code = 'example';
      dto.name = '更新后的域名';

      const mockRequest = {
        user: {
          uid: 'current-user-123',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('更新失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.updateDomain(dto, mockRequest)).rejects.toThrow(
        '更新失败',
      );
    });
  });

  describe('deleteDomain', () => {
    /**
     * 应该成功删除域
     *
     * 验证能够正确执行删除域命令并返回成功结果。
     */
    it('应该成功删除域', async () => {
      const domainId = 'domain-123';

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deleteDomain(domainId);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DomainDeleteCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(DomainDeleteCommand);
      expect(command.id).toBe(domainId);
    });

    /**
     * 应该正确处理删除异常
     *
     * 验证当删除失败时，能够正确传播异常。
     */
    it('应该正确处理删除异常', async () => {
      const domainId = 'domain-123';

      const error = new Error('删除失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.deleteDomain(domainId)).rejects.toThrow(
        '删除失败',
      );
    });
  });
});

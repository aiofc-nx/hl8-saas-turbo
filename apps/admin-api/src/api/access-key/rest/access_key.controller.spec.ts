import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { AccessKeyCreateCommand } from '@/lib/bounded-contexts/access-key/commands/access_key-create.command';
import { AccessKeyDeleteCommand } from '@/lib/bounded-contexts/access-key/commands/access_key-delete.command';
import { AccessKeyProperties } from '@/lib/bounded-contexts/access-key/domain/access_key.read.model';
import { PageAccessKeysQuery } from '@/lib/bounded-contexts/access-key/queries/page-access_key.query';
import { BUILT_IN } from '@/lib/shared/constants/db.constant';
import { Status } from '@/lib/shared/enums/status.enum';

import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { AccessKeyCreateDto } from '../dto/access_key.dto';
import { PageAccessKeysQueryDto } from '../dto/page-access_key.dto';
import { AccessKeyController } from './access_key.controller';

/**
 * AccessKeyController 单元测试
 *
 * @description
 * 测试访问密钥控制器的实现，验证分页查询、创建和删除访问密钥的功能。
 */
describe('AccessKeyController', () => {
  let controller: AccessKeyController;
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
      controllers: [AccessKeyController],
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

    controller = module.get<AccessKeyController>(AccessKeyController);
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
     * 应该成功分页查询访问密钥列表（内置域用户）
     *
     * 验证内置域用户能够查询指定域的访问密钥。
     */
    it('应该成功分页查询访问密钥列表（内置域用户）', async () => {
      const queryDto = new PageAccessKeysQueryDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.domain = 'example.com';
      queryDto.status = Status.ENABLED;

      const mockRequest = {
        user: {
          uid: 'user-123',
          domain: BUILT_IN,
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const mockResult = new PaginationResult<AccessKeyProperties>(1, 10, 2, [
        {
          id: 'key-1',
          domain: 'example.com',
          status: Status.ENABLED,
          description: '密钥1',
          createdAt: new Date(),
          createdBy: 'user-1',
        } as AccessKeyProperties,
      ]);

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.page(queryDto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PageAccessKeysQuery),
      );

      // 验证查询参数中的域
      const query = (queryBus.execute as jest.Mock).mock.calls[0][0];
      expect(query.domain).toBe('example.com');
    });

    /**
     * 应该成功分页查询访问密钥列表（非内置域用户）
     *
     * 验证非内置域用户只能查询自己域的访问密钥。
     */
    it('应该成功分页查询访问密钥列表（非内置域用户）', async () => {
      const queryDto = new PageAccessKeysQueryDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.domain = 'other-domain.com'; // 这个域应该被忽略
      queryDto.status = Status.ENABLED;

      const mockRequest = {
        user: {
          uid: 'user-123',
          domain: 'example.com', // 用户自己的域
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const mockResult = new PaginationResult<AccessKeyProperties>(1, 10, 1, [
        {
          id: 'key-1',
          domain: 'example.com',
          status: Status.ENABLED,
          description: '密钥1',
          createdAt: new Date(),
          createdBy: 'user-1',
        } as AccessKeyProperties,
      ]);

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.page(queryDto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);

      // 验证查询参数中的域应该是用户自己的域，而不是 queryDto 中的域
      const query = (queryBus.execute as jest.Mock).mock.calls[0][0];
      expect(query.domain).toBe('example.com');
      expect(query.domain).not.toBe('other-domain.com');
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当查询失败时，能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const queryDto = new PageAccessKeysQueryDto();
      queryDto.current = 1;
      queryDto.size = 10;

      const mockRequest = {
        user: {
          uid: 'user-123',
          domain: BUILT_IN,
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('查询失败');
      (queryBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.page(queryDto, mockRequest)).rejects.toThrow(
        '查询失败',
      );
    });
  });

  describe('createAccessKey', () => {
    /**
     * 应该成功创建访问密钥（内置域用户）
     *
     * 验证内置域用户能够为指定域创建访问密钥。
     */
    it('应该成功创建访问密钥（内置域用户）', async () => {
      const dto = new AccessKeyCreateDto();
      dto.domain = 'example.com';
      dto.description = '用于第三方系统集成';

      const mockRequest = {
        user: {
          uid: 'user-123',
          domain: BUILT_IN,
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.createAccessKey(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(AccessKeyCreateCommand),
      );

      // 验证命令参数中的域
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(AccessKeyCreateCommand);
      expect(command.domain).toBe('example.com');
    });

    /**
     * 应该成功创建访问密钥（非内置域用户）
     *
     * 验证非内置域用户只能为自己域创建访问密钥。
     */
    it('应该成功创建访问密钥（非内置域用户）', async () => {
      const dto = new AccessKeyCreateDto();
      dto.domain = 'other-domain.com'; // 这个域应该被忽略
      dto.description = '用于第三方系统集成';

      const mockRequest = {
        user: {
          uid: 'user-123',
          domain: 'example.com', // 用户自己的域
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.createAccessKey(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);

      // 验证命令参数中的域应该是用户自己的域
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command.domain).toBe('example.com');
      expect(command.domain).not.toBe('other-domain.com');
    });

    /**
     * 应该正确处理创建异常
     *
     * 验证当创建失败时，能够正确传播异常。
     */
    it('应该正确处理创建异常', async () => {
      const dto = new AccessKeyCreateDto();
      dto.domain = 'example.com';
      dto.description = '用于第三方系统集成';

      const mockRequest = {
        user: {
          uid: 'user-123',
          domain: BUILT_IN,
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('创建失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.createAccessKey(dto, mockRequest),
      ).rejects.toThrow('创建失败');
    });
  });

  describe('deleteAccessKey', () => {
    /**
     * 应该成功删除访问密钥
     *
     * 验证能够正确执行删除访问密钥命令并返回成功结果。
     */
    it('应该成功删除访问密钥', async () => {
      const accessKeyId = 'key-123';

      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deleteAccessKey(accessKeyId);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(AccessKeyDeleteCommand),
      );

      // 验证命令参数
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(AccessKeyDeleteCommand);
      expect(command.id).toBe(accessKeyId);
    });

    /**
     * 应该正确处理删除异常
     *
     * 验证当删除失败时，能够正确传播异常。
     */
    it('应该正确处理删除异常', async () => {
      const accessKeyId = 'key-123';

      const error = new Error('删除失败');
      (commandBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.deleteAccessKey(accessKeyId)).rejects.toThrow(
        '删除失败',
      );
    });
  });
});

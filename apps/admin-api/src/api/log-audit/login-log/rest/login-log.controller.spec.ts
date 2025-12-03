import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { LoginLogProperties } from '@/lib/bounded-contexts/log-audit/login-log/domain/login-log.read.model';
import { PageLoginLogsQuery } from '@/lib/bounded-contexts/log-audit/login-log/queries/page-login-logs.query';

import { AuthZGuard } from '@hl8/casbin';
import { ApiRes, PaginationResult } from '@hl8/rest';

import { PageLoginLogsQueryDto } from '../dto/page-login-log.dto';
import { LoginLogController } from './login-log.controller';

/**
 * LoginLogController 单元测试
 *
 * @description
 * 测试登录日志控制器的实现，验证分页查询登录日志的功能。
 */
describe('LoginLogController', () => {
  let controller: LoginLogController;
  let queryBus: jest.Mocked<QueryBus>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock QueryBus 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock QueryBus
    const mockQueryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginLogController],
      providers: [
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    })
      .overrideGuard(AuthZGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<LoginLogController>(LoginLogController);
    queryBus = module.get(QueryBus);
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
     * 应该成功分页查询登录日志列表
     *
     * 验证能够正确执行分页查询并返回结果。
     */
    it('应该成功分页查询登录日志列表', async () => {
      const queryDto = new PageLoginLogsQueryDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.username = 'testuser';
      queryDto.domain = 'example.com';
      queryDto.address = '192.168.1.1';
      queryDto.type = 'password';

      const mockResult = new PaginationResult<LoginLogProperties>(1, 10, 2, [
        {
          id: 'log-1',
          userId: 'user-1',
          username: 'testuser',
          domain: 'example.com',
          ip: '192.168.1.1',
          address: '北京市',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-1',
          type: 'password',
          loginTime: new Date(),
          port: 8080,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as LoginLogProperties,
        {
          id: 'log-2',
          userId: 'user-2',
          username: 'testuser2',
          domain: 'example.com',
          ip: '192.168.1.2',
          address: '上海市',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-2',
          type: 'password',
          loginTime: new Date(),
          port: 8080,
          createdAt: new Date(),
          createdBy: 'user-2',
        } as LoginLogProperties,
      ]);

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.page(queryDto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PageLoginLogsQuery),
      );
      expect(queryBus.execute).toHaveBeenCalledTimes(1);

      // 验证查询参数
      const query = (queryBus.execute as jest.Mock).mock.calls[0][0];
      expect(query.username).toBe('testuser');
      expect(query.domain).toBe('example.com');
      expect(query.address).toBe('192.168.1.1');
      expect(query.type).toBe('password');
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当查询失败时，能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const queryDto = new PageLoginLogsQueryDto();
      queryDto.current = 1;
      queryDto.size = 10;

      const error = new Error('查询失败');
      (queryBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.page(queryDto)).rejects.toThrow('查询失败');
    });
  });
});

import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { OperationLogProperties } from '@/lib/bounded-contexts/log-audit/operation-log/domain/operation-log.read.model';
import { PageOperationLogsQuery } from '@/lib/bounded-contexts/log-audit/operation-log/queries/page-operation-logs.query';

import { AuthZGuard } from '@hl8/casbin';
import { ApiRes, PaginationResult } from '@hl8/rest';

import { PageOperationLogsQueryDto } from '../dto/page-operation-log.dto';
import { OperationLogController } from './operation-log.controller';

/**
 * OperationLogController 单元测试
 *
 * @description
 * 测试操作日志控制器的实现，验证分页查询操作日志的功能。
 */
describe('OperationLogController', () => {
  let controller: OperationLogController;
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
      controllers: [OperationLogController],
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

    controller = module.get<OperationLogController>(OperationLogController);
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
     * 应该成功分页查询操作日志列表
     *
     * 验证能够正确执行分页查询并返回结果。
     */
    it('应该成功分页查询操作日志列表', async () => {
      const queryDto = new PageOperationLogsQueryDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.username = 'testuser';
      queryDto.domain = 'example.com';
      queryDto.moduleName = 'user';
      queryDto.method = 'POST';

      const mockResult = new PaginationResult<OperationLogProperties>(
        1,
        10,
        2,
        [
          {
            id: 'log-1',
            userId: 'user-1',
            username: 'testuser',
            domain: 'example.com',
            moduleName: '用户管理',
            description: '创建用户',
            method: 'POST',
            url: '/api/users',
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            requestId: 'req-1',
            params: {},
            body: { name: '新用户' },
            response: { id: 'user-123' },
            startTime: new Date(),
            endTime: new Date(),
            duration: 150,
            createdAt: new Date(),
            createdBy: 'user-1',
          } as OperationLogProperties,
          {
            id: 'log-2',
            userId: 'user-2',
            username: 'testuser2',
            domain: 'example.com',
            moduleName: '用户管理',
            description: '更新用户',
            method: 'PUT',
            url: '/api/users/user-123',
            ip: '192.168.1.2',
            userAgent: 'Mozilla/5.0',
            requestId: 'req-2',
            params: {},
            body: { name: '更新后的用户名' },
            response: { success: true },
            startTime: new Date(),
            endTime: new Date(),
            duration: 100,
            createdAt: new Date(),
            createdBy: 'user-2',
          } as OperationLogProperties,
        ],
      );

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.page(queryDto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PageOperationLogsQuery),
      );
      expect(queryBus.execute).toHaveBeenCalledTimes(1);

      // 验证查询参数
      const query = (queryBus.execute as jest.Mock).mock.calls[0][0];
      expect(query.username).toBe('testuser');
      expect(query.domain).toBe('example.com');
      expect(query.moduleName).toBe('user');
      expect(query.method).toBe('POST');
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当查询失败时，能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const queryDto = new PageOperationLogsQueryDto();
      queryDto.current = 1;
      queryDto.size = 10;

      const error = new Error('查询失败');
      (queryBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.page(queryDto)).rejects.toThrow('查询失败');
    });
  });
});

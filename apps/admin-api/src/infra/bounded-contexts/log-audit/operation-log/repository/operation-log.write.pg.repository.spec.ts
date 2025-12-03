import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { OperationLog } from '@/lib/bounded-contexts/log-audit/operation-log/domain/operation-log.model';

import { OperationLogWriteRepository } from './operation-log.write.pg.repository';

/**
 * OperationLogWriteRepository 单元测试
 *
 * @description
 * 测试操作日志写入仓储的实现，验证保存操作日志的功能。
 */
describe('OperationLogWriteRepository', () => {
  let repository: OperationLogWriteRepository;
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
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationLogWriteRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<OperationLogWriteRepository>(
      OperationLogWriteRepository,
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
     * 应该成功保存操作日志
     *
     * 验证能够正确创建并持久化操作日志。
     */
    it('应该成功保存操作日志', async () => {
      const operationLog = new OperationLog({
        userId: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        moduleName: '用户管理',
        description: '创建用户',
        method: 'POST',
        url: '/api/users',
        params: {},
        body: { name: '新用户' },
        response: { id: 'user-456' },
        ip: '192.168.1.1',
        address: '北京市',
        userAgent: 'Mozilla/5.0',
        requestId: 'req-123',
        startTime: new Date(),
        endTime: new Date(),
        duration: 150,
        createdAt: new Date(),
        createdBy: 'user-123',
      });

      const mockOperationLogEntity = {
        id: 'log-123',
        ...operationLog,
      };

      (entityManager.create as jest.Mock).mockReturnValue(
        mockOperationLogEntity,
      );
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      await repository.save(operationLog);

      expect(entityManager.create).toHaveBeenCalledWith(
        'SysOperationLog',
        expect.objectContaining({
          userId: operationLog.userId,
          username: operationLog.username,
          domain: operationLog.domain,
          moduleName: operationLog.moduleName,
          method: operationLog.method,
          url: operationLog.url,
        }),
      );
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(
        mockOperationLogEntity,
      );
    });

    /**
     * 应该正确处理保存异常
     *
     * 验证当保存操作失败时，能够正确传播异常。
     */
    it('应该正确处理保存异常', async () => {
      const operationLog = new OperationLog({
        userId: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        moduleName: '用户管理',
        description: '查询用户列表',
        method: 'GET',
        url: '/api/users',
        params: {},
        body: null,
        response: { data: [] },
        ip: '192.168.1.1',
        address: '北京市',
        userAgent: 'Mozilla/5.0',
        requestId: 'req-123',
        startTime: new Date(),
        endTime: new Date(),
        duration: 50,
        createdAt: new Date(),
        createdBy: 'user-123',
      });

      const error = new Error('数据库保存失败');
      (entityManager.create as jest.Mock).mockReturnValue({});
      (entityManager.persistAndFlush as jest.Mock).mockRejectedValue(error);

      await expect(repository.save(operationLog)).rejects.toThrow(
        '数据库保存失败',
      );
    });
  });
});

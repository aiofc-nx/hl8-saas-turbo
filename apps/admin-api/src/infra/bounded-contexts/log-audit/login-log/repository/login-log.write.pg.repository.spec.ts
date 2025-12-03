import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { LoginLogEntity } from '@/lib/bounded-contexts/log-audit/login-log/domain/login-log.entity';

import { LoginLogWriteRepository } from './login-log.write.pg.repository';

/**
 * LoginLogWriteRepository 单元测试
 *
 * @description
 * 测试登录日志写入仓储的实现，验证保存登录日志的功能。
 */
describe('LoginLogWriteRepository', () => {
  let repository: LoginLogWriteRepository;
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
        LoginLogWriteRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<LoginLogWriteRepository>(LoginLogWriteRepository);
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
     * 应该成功保存登录日志
     *
     * 验证能够正确创建并持久化登录日志，使用 ULID 生成唯一 ID。
     */
    it('应该成功保存登录日志', async () => {
      const loginLog = new LoginLogEntity(
        'user-123',
        'testuser',
        'example.com',
        '192.168.1.1',
        '北京市',
        'Mozilla/5.0',
        'req-123',
        'success',
        'user-123',
        8080,
      );

      const mockLoginLogEntity = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        ...loginLog,
        loginTime: new Date(),
        createdAt: new Date(),
        createdBy: loginLog.userId,
      };

      (entityManager.create as jest.Mock).mockReturnValue(mockLoginLogEntity);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      await repository.save(loginLog);

      expect(entityManager.create).toHaveBeenCalledWith(
        'SysLoginLog',
        expect.objectContaining({
          userId: loginLog.userId,
          username: loginLog.username,
          domain: loginLog.domain,
          ip: loginLog.ip,
          address: loginLog.address,
          userAgent: loginLog.userAgent,
          requestId: loginLog.requestId,
          type: loginLog.type,
          port: loginLog.port,
          createdBy: loginLog.userId,
        }),
      );
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(
        mockLoginLogEntity,
      );
    });

    /**
     * 应该成功保存登录日志（无端口号）
     *
     * 验证当端口号为 null 时，能够正确保存登录日志。
     */
    it('应该成功保存登录日志（无端口号）', async () => {
      const loginLog = new LoginLogEntity(
        'user-123',
        'testuser',
        'example.com',
        '192.168.1.1',
        '北京市',
        'Mozilla/5.0',
        'req-123',
        'success',
        'user-123',
        null,
      );

      const mockLoginLogEntity = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        ...loginLog,
        loginTime: new Date(),
        createdAt: new Date(),
        createdBy: loginLog.userId,
      };

      (entityManager.create as jest.Mock).mockReturnValue(mockLoginLogEntity);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      await repository.save(loginLog);

      expect(entityManager.create).toHaveBeenCalledWith(
        'SysLoginLog',
        expect.objectContaining({
          port: null,
        }),
      );
    });

    /**
     * 应该正确处理保存异常
     *
     * 验证当保存操作失败时，能够正确传播异常。
     */
    it('应该正确处理保存异常', async () => {
      const loginLog = new LoginLogEntity(
        'user-123',
        'testuser',
        'example.com',
        '192.168.1.1',
        '北京市',
        'Mozilla/5.0',
        'req-123',
        'success',
        'user-123',
      );

      const error = new Error('数据库保存失败');
      (entityManager.create as jest.Mock).mockReturnValue({});
      (entityManager.persistAndFlush as jest.Mock).mockRejectedValue(error);

      await expect(repository.save(loginLog)).rejects.toThrow('数据库保存失败');
    });
  });
});

import { BadRequestException } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { AccessKeyDeleteCommand } from '../../commands/access_key-delete.command';
import {
  AccessKeyReadRepoPortToken,
  AccessKeyWriteRepoPortToken,
} from '../../constants';
import type { AccessKeyReadRepoPort } from '../../ports/access_key.read.repo-port';
import type { AccessKeyWriteRepoPort } from '../../ports/access_key.write.repo-port';
import { AccessKeyDeleteHandler } from './access_key-delete.command.handler';

/**
 * AccessKeyDeleteHandler 单元测试
 *
 * 测试访问密钥删除命令处理器的业务逻辑。
 */
describe('AccessKeyDeleteHandler', () => {
  let handler: AccessKeyDeleteHandler;
  let accessKeyWriteRepository: AccessKeyWriteRepoPort;
  let eventPublisher: EventPublisher;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 写入仓储
    const mockAccessKeyWriteRepository: AccessKeyWriteRepoPort = {
      save: jest.fn().mockResolvedValue(undefined),
      deleteById: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };

    // 创建 Mock 读取仓储
    const mockAccessKeyReadRepository: AccessKeyReadRepoPort = {
      getAccessKeyById: jest.fn(),
      getAccessKeysByDomain: jest.fn(),
      pageAccessKeys: jest.fn(),
    };

    // 创建 Mock 事件发布器
    const mockEventPublisher = {
      mergeObjectContext: jest.fn().mockImplementation((obj) => {
        const mergedObject = obj;
        mergedObject.commit = jest.fn();
        mergedObject.deleted = jest.fn().mockResolvedValue(undefined);
        return mergedObject;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessKeyDeleteHandler,
        {
          provide: AccessKeyWriteRepoPortToken,
          useValue: mockAccessKeyWriteRepository,
        },
        {
          provide: AccessKeyReadRepoPortToken,
          useValue: mockAccessKeyReadRepository,
        },
        {
          provide: EventPublisher,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    handler = module.get<AccessKeyDeleteHandler>(AccessKeyDeleteHandler);
    accessKeyWriteRepository = module.get<AccessKeyWriteRepoPort>(
      AccessKeyWriteRepoPortToken,
    );
    eventPublisher = module.get<EventPublisher>(EventPublisher);
  });

  /**
   * 应该成功删除访问密钥
   *
   * 验证当提供有效的命令时，处理器能够正确删除访问密钥。
   */
  it('应该成功删除访问密钥', async () => {
    const command = new AccessKeyDeleteCommand('access-key-123');
    const mockAccessKey = {
      id: 'access-key-123',
      AccessKeyID: 'key-id',
      AccessKeySecret: 'key-secret',
      status: 'ENABLED',
      domain: 'example.com',
    };

    const readRepo = handler['accessKeyReadRepoPort'];
    (readRepo.getAccessKeyById as jest.Mock).mockResolvedValue(mockAccessKey);

    await handler.execute(command);

    expect(readRepo.getAccessKeyById).toHaveBeenCalledWith('access-key-123');
    expect(accessKeyWriteRepository.deleteById).toHaveBeenCalledWith(
      'access-key-123',
    );
    expect(accessKeyWriteRepository.deleteById).toHaveBeenCalledTimes(1);
  });

  /**
   * 应该发布访问密钥删除事件
   *
   * 验证处理器能够正确发布访问密钥删除事件。
   */
  it('应该发布访问密钥删除事件', async () => {
    const command = new AccessKeyDeleteCommand('access-key-123');
    const mockAccessKey = {
      id: 'access-key-123',
      AccessKeyID: 'key-id',
      AccessKeySecret: 'key-secret',
      status: 'ENABLED',
      domain: 'example.com',
    };

    const readRepo = handler['accessKeyReadRepoPort'];
    (readRepo.getAccessKeyById as jest.Mock).mockResolvedValue(mockAccessKey);

    await handler.execute(command);

    expect(eventPublisher.mergeObjectContext).toHaveBeenCalledTimes(1);
  });

  /**
   * 应该在访问密钥不存在时抛出异常
   *
   * 验证当访问密钥不存在时，处理器能够正确抛出 BadRequestException。
   */
  it('应该在访问密钥不存在时抛出异常', async () => {
    const command = new AccessKeyDeleteCommand('non-existent-key');

    const readRepo = handler['accessKeyReadRepoPort'];
    (readRepo.getAccessKeyById as jest.Mock).mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
    expect(accessKeyWriteRepository.deleteById).not.toHaveBeenCalled();
  });

  /**
   * 应该在删除失败时抛出异常
   *
   * 验证当仓储删除操作失败时，处理器能够正确抛出异常。
   */
  it('应该在删除失败时抛出异常', async () => {
    const command = new AccessKeyDeleteCommand('access-key-123');
    const mockAccessKey = {
      id: 'access-key-123',
      AccessKeyID: 'key-id',
      AccessKeySecret: 'key-secret',
      status: 'ENABLED',
      domain: 'example.com',
    };

    const readRepo = handler['accessKeyReadRepoPort'];
    (readRepo.getAccessKeyById as jest.Mock).mockResolvedValue(mockAccessKey);

    const error = new Error('删除失败');
    (accessKeyWriteRepository.deleteById as jest.Mock).mockRejectedValue(error);

    await expect(handler.execute(command)).rejects.toThrow('删除失败');
  });

  /**
   * 应该使用正确的命令参数
   *
   * 验证处理器使用命令对象中的正确 ID。
   */
  it('应该使用正确的命令参数', async () => {
    const accessKeyId = 'access-key-456';
    const command = new AccessKeyDeleteCommand(accessKeyId);
    const mockAccessKey = {
      id: accessKeyId,
      AccessKeyID: 'key-id',
      AccessKeySecret: 'key-secret',
      status: 'ENABLED',
      domain: 'example.com',
    };

    const readRepo = handler['accessKeyReadRepoPort'];
    (readRepo.getAccessKeyById as jest.Mock).mockResolvedValue(mockAccessKey);

    await handler.execute(command);

    expect(readRepo.getAccessKeyById).toHaveBeenCalledWith(accessKeyId);
    expect(accessKeyWriteRepository.deleteById).toHaveBeenCalledWith(
      accessKeyId,
    );
    expect(accessKeyWriteRepository.deleteById).not.toHaveBeenCalledWith(
      'wrong-id',
    );
  });
});

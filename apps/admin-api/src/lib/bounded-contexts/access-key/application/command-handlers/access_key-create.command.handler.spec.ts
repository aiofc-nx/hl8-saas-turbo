import { EventPublisher } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { AccessKeyCreateCommand } from '../../commands/access_key-create.command';
import { AccessKeyWriteRepoPortToken } from '../../constants';
import type { AccessKeyWriteRepoPort } from '../../ports/access_key.write.repo-port';
import { AccessKeyCreateHandler } from './access_key-create.command.handler';

/**
 * AccessKeyCreateHandler 单元测试
 *
 * 测试访问密钥创建命令处理器的业务逻辑。
 */
describe('AccessKeyCreateHandler', () => {
  let handler: AccessKeyCreateHandler;
  let accessKeyWriteRepository: AccessKeyWriteRepoPort;
  let eventPublisher: EventPublisher;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 仓储
    const mockAccessKeyWriteRepository: AccessKeyWriteRepoPort = {
      save: jest.fn().mockResolvedValue(undefined),
      deleteById: jest.fn().mockResolvedValue(undefined),
    };

    // 创建 Mock 事件发布器
    const mockEventPublisher = {
      mergeObjectContext: jest.fn().mockReturnValue({
        commit: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessKeyCreateHandler,
        {
          provide: AccessKeyWriteRepoPortToken,
          useValue: mockAccessKeyWriteRepository,
        },
        {
          provide: EventPublisher,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    handler = module.get<AccessKeyCreateHandler>(AccessKeyCreateHandler);
    accessKeyWriteRepository = module.get<AccessKeyWriteRepoPort>(
      AccessKeyWriteRepoPortToken,
    );
    eventPublisher = module.get<EventPublisher>(EventPublisher);
  });

  /**
   * 应该成功创建访问密钥
   *
   * 验证当提供有效的命令时，处理器能够正确创建访问密钥。
   */
  it('应该成功创建访问密钥', async () => {
    const command = new AccessKeyCreateCommand(
      'test-domain',
      '测试密钥',
      'user-123',
    );

    await handler.execute(command);

    expect(accessKeyWriteRepository.save).toHaveBeenCalledTimes(1);
    const savedAccessKey = (accessKeyWriteRepository.save as jest.Mock).mock
      .calls[0][0];
    expect(savedAccessKey).toBeDefined();
    expect(savedAccessKey.domain).toBe('test-domain');
    expect(savedAccessKey.description).toBe('测试密钥');
  });

  /**
   * 应该生成唯一的密钥 ID 和密钥值
   *
   * 验证处理器能够为每个访问密钥生成唯一的 ID 和密钥值。
   */
  it('应该生成唯一的密钥 ID 和密钥值', async () => {
    const command = new AccessKeyCreateCommand(
      'test-domain',
      '测试密钥',
      'user-123',
    );

    await handler.execute(command);

    const savedAccessKey = (accessKeyWriteRepository.save as jest.Mock).mock
      .calls[0][0];
    expect(savedAccessKey.AccessKeyID).toBeDefined();
    expect(savedAccessKey.AccessKeySecret).toBeDefined();
    expect(savedAccessKey.AccessKeyID).not.toBe(savedAccessKey.AccessKeySecret);
  });

  /**
   * 应该设置默认状态为启用
   *
   * 验证新创建的访问密钥默认状态为启用。
   */
  it('应该设置默认状态为启用', async () => {
    const command = new AccessKeyCreateCommand(
      'test-domain',
      '测试密钥',
      'user-123',
    );

    await handler.execute(command);

    const savedAccessKey = (accessKeyWriteRepository.save as jest.Mock).mock
      .calls[0][0];
    expect(savedAccessKey.status).toBe('ENABLED');
  });

  /**
   * 应该设置创建者和创建时间
   *
   * 验证新创建的访问密钥包含正确的创建者和创建时间信息。
   */
  it('应该设置创建者和创建时间', async () => {
    const command = new AccessKeyCreateCommand(
      'test-domain',
      '测试密钥',
      'user-123',
    );

    await handler.execute(command);

    const savedAccessKey = (accessKeyWriteRepository.save as jest.Mock).mock
      .calls[0][0];
    expect(savedAccessKey.createdBy).toBe('user-123');
    expect(savedAccessKey.createdAt).toBeInstanceOf(Date);
  });

  /**
   * 应该发布访问密钥创建事件
   *
   * 验证处理器能够正确发布访问密钥创建事件。
   */
  it('应该发布访问密钥创建事件', async () => {
    const command = new AccessKeyCreateCommand(
      'test-domain',
      '测试密钥',
      'user-123',
    );

    const mockCommit = jest.fn();
    const mockCreated = jest.fn().mockResolvedValue(undefined);
    let mergedObject: any;

    (eventPublisher.mergeObjectContext as jest.Mock).mockImplementation(
      (obj) => {
        mergedObject = obj;
        mergedObject.commit = mockCommit;
        mergedObject.created = mockCreated;
        return mergedObject;
      },
    );

    await handler.execute(command);

    expect(eventPublisher.mergeObjectContext).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  /**
   * 应该处理可选的域字段
   *
   * 验证当域字段为空字符串时，处理器能够正确处理。
   */
  it('应该处理可选的域字段', async () => {
    const command = new AccessKeyCreateCommand('', '测试密钥', 'user-123');

    await handler.execute(command);

    const savedAccessKey = (accessKeyWriteRepository.save as jest.Mock).mock
      .calls[0][0];
    expect(savedAccessKey.domain).toBe('');
  });

  /**
   * 应该处理可选的描述字段
   *
   * 验证当描述字段为 null 时，处理器能够正确处理。
   */
  it('应该处理可选的描述字段', async () => {
    const command = new AccessKeyCreateCommand('test-domain', null, 'user-123');

    await handler.execute(command);

    const savedAccessKey = (accessKeyWriteRepository.save as jest.Mock).mock
      .calls[0][0];
    expect(savedAccessKey.description).toBeNull();
  });

  /**
   * 应该在保存失败时抛出异常
   *
   * 验证当仓储保存操作失败时，处理器能够正确抛出异常。
   */
  it('应该在保存失败时抛出异常', async () => {
    const command = new AccessKeyCreateCommand(
      'test-domain',
      '测试密钥',
      'user-123',
    );

    const error = new Error('保存失败');
    (accessKeyWriteRepository.save as jest.Mock).mockRejectedValue(error);

    await expect(handler.execute(command)).rejects.toThrow('保存失败');
  });
});

import { Test, TestingModule } from '@nestjs/testing';

import { CacheConstant } from '@hl8/constants';
import { MailService } from '@hl8/mail';
import { RedisUtility } from '@hl8/redis';

import { UserReadRepoPortToken } from '../../constants';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import { UserCreatedHandler } from './user-created.event.handler';

// Mock @repo/constants/app 模块
jest.mock('@repo/constants/app', () => ({
  APP_NAME: 'Test App',
  APP_URL: 'https://test.example.com',
}));

/**
 * UserCreatedHandler 单元测试
 *
 * 测试用户创建事件处理器的业务逻辑。
 */
describe('UserCreatedHandler', () => {
  let handler: UserCreatedHandler;
  let userReadRepoPort: UserReadRepoPort;
  let mailService: MailService;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 用户读取仓储
    const mockUserReadRepoPort: UserReadRepoPort = {
      findUserById: jest.fn(),
      findUserByEmail: jest.fn(),
      findUserByIdentifier: jest.fn(),
      pageUsers: jest.fn(),
      getUserIdsByRoleId: jest.fn(),
      getUsersByIds: jest.fn(),
    };

    // 创建 Mock 邮件服务
    const mockMailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    // Mock RedisUtility
    const mockRedisInstance = {
      setex: jest.fn().mockResolvedValue('OK'),
    };
    jest
      .spyOn(RedisUtility, 'instance', 'get')
      .mockReturnValue(mockRedisInstance as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCreatedHandler,
        {
          provide: UserReadRepoPortToken,
          useValue: mockUserReadRepoPort,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    handler = module.get<UserCreatedHandler>(UserCreatedHandler);
    userReadRepoPort = module.get<UserReadRepoPort>(UserReadRepoPortToken);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * 应该成功处理用户创建事件
   *
   * 验证当用户存在且有邮箱时，处理器能够正确发送验证邮件。
   */
  it('应该成功处理用户创建事件', async () => {
    const event = new UserCreatedEvent('user-123', 'testuser', 'example.com');
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      nickName: '测试用户',
    };

    (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(mockUser);

    await handler.handle(event);

    expect(userReadRepoPort.findUserById).toHaveBeenCalledWith('user-123');
    expect(RedisUtility.instance.setex).toHaveBeenCalled();
    expect(mailService.sendEmail).toHaveBeenCalledTimes(1);
  });

  /**
   * 应该生成并存储 OTP 验证码
   *
   * 验证处理器能够生成 6 位数字 OTP 并存储到 Redis。
   */
  it('应该生成并存储 OTP 验证码', async () => {
    const event = new UserCreatedEvent('user-123', 'testuser', 'example.com');
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
    };

    (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(mockUser);

    await handler.handle(event);

    const setexCall = (RedisUtility.instance.setex as jest.Mock).mock.calls[0];
    expect(setexCall[0]).toContain(CacheConstant.EMAIL_VERIFICATION_PREFIX);
    expect(setexCall[0]).toContain('test@example.com');
    expect(setexCall[1]).toBe(600); // 10 分钟
    expect(setexCall[2]).toMatch(/^\d{6}$/); // 6 位数字
  });

  /**
   * 应该发送包含 OTP 的验证邮件
   *
   * 验证处理器能够发送包含正确 OTP 的验证邮件。
   */
  it('应该发送包含 OTP 的验证邮件', async () => {
    const event = new UserCreatedEvent('user-123', 'testuser', 'example.com');
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      nickName: '测试用户',
    };

    (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(mockUser);

    await handler.handle(event);

    expect(mailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['test@example.com'],
        subject: '欢迎注册 - 请验证您的邮箱',
      }),
    );

    const emailCall = (mailService.sendEmail as jest.Mock).mock.calls[0][0];
    expect(emailCall.html).toBeDefined();
    expect(typeof emailCall.html).toBe('string');
  });

  /**
   * 应该跳过邮件发送当用户不存在时
   *
   * 验证当用户不存在时，处理器能够优雅地跳过邮件发送。
   */
  it('应该跳过邮件发送当用户不存在时', async () => {
    const event = new UserCreatedEvent('user-123', 'testuser', 'example.com');

    (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(null);

    await handler.handle(event);

    expect(userReadRepoPort.findUserById).toHaveBeenCalledWith('user-123');
    expect(RedisUtility.instance.setex).not.toHaveBeenCalled();
    expect(mailService.sendEmail).not.toHaveBeenCalled();
  });

  /**
   * 应该跳过邮件发送当用户没有邮箱时
   *
   * 验证当用户没有邮箱时，处理器能够优雅地跳过邮件发送。
   */
  it('应该跳过邮件发送当用户没有邮箱时', async () => {
    const event = new UserCreatedEvent('user-123', 'testuser', 'example.com');
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: null,
    };

    (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(mockUser);

    await handler.handle(event);

    expect(userReadRepoPort.findUserById).toHaveBeenCalledWith('user-123');
    expect(RedisUtility.instance.setex).not.toHaveBeenCalled();
    expect(mailService.sendEmail).not.toHaveBeenCalled();
  });

  /**
   * 应该使用用户名当昵称不存在时
   *
   * 验证当用户没有昵称时，邮件中使用用户名。
   */
  it('应该使用用户名当昵称不存在时', async () => {
    const event = new UserCreatedEvent('user-123', 'testuser', 'example.com');
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      nickName: null,
    };

    (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(mockUser);

    await handler.handle(event);

    const emailCall = (mailService.sendEmail as jest.Mock).mock.calls[0][0];
    expect(emailCall.html).toContain('testuser');
  });

  /**
   * 应该正确处理邮件发送失败
   *
   * 验证当邮件发送失败时，处理器能够正确处理异常。
   */
  it('应该正确处理邮件发送失败', async () => {
    const event = new UserCreatedEvent('user-123', 'testuser', 'example.com');
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
    };

    (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(mockUser);
    (mailService.sendEmail as jest.Mock).mockRejectedValue(
      new Error('邮件发送失败'),
    );

    // 应该不抛出异常，事件处理器应该优雅地处理错误
    await expect(handler.handle(event)).resolves.not.toThrow();
  });
});

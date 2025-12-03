import { PasswordIdentifierDTO } from './password-identifier.dto';

/**
 * PasswordIdentifierDTO 单元测试
 *
 * @description
 * 测试密码标识符数据传输对象的构造函数和属性设置。
 */
describe('PasswordIdentifierDTO', () => {
  /**
   * 应该正确创建 DTO 实例
   *
   * 验证当提供所有必填参数时，DTO 能够正确创建并设置属性。
   */
  it('应该正确创建 DTO 实例', () => {
    const dto = new PasswordIdentifierDTO(
      'testuser@example.com',
      'password123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'web',
    );

    expect(dto.identifier).toBe('testuser@example.com');
    expect(dto.password).toBe('password123');
    expect(dto.ip).toBe('192.168.1.1');
    expect(dto.address).toBe('北京市');
    expect(dto.userAgent).toBe('Mozilla/5.0');
    expect(dto.requestId).toBe('request-123');
    expect(dto.type).toBe('web');
    expect(dto.port).toBeUndefined();
  });

  /**
   * 应该正确设置可选端口参数
   *
   * 验证当提供端口参数时，DTO 能够正确设置端口属性。
   */
  it('应该正确设置可选端口参数', () => {
    const dto = new PasswordIdentifierDTO(
      'testuser@example.com',
      'password123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'web',
      8080,
    );

    expect(dto.port).toBe(8080);
  });

  /**
   * 应该正确处理 null 端口参数
   *
   * 验证当端口参数为 null 时，DTO 能够正确处理。
   */
  it('应该正确处理 null 端口参数', () => {
    const dto = new PasswordIdentifierDTO(
      'testuser@example.com',
      'password123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'web',
      null,
    );

    expect(dto.port).toBeNull();
  });

  /**
   * 应该支持不同的标识符格式
   *
   * 验证 DTO 能够支持用户名、邮箱、手机号等不同格式的标识符。
   */
  it('应该支持不同的标识符格式', () => {
    const emailDto = new PasswordIdentifierDTO(
      'user@example.com',
      'password123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'web',
    );
    expect(emailDto.identifier).toBe('user@example.com');

    const phoneDto = new PasswordIdentifierDTO(
      '13800138000',
      'password123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'web',
    );
    expect(phoneDto.identifier).toBe('13800138000');

    const usernameDto = new PasswordIdentifierDTO(
      'testuser',
      'password123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'web',
    );
    expect(usernameDto.identifier).toBe('testuser');
  });

  /**
   * 应该正确设置所有必填属性
   *
   * 验证所有必填属性都能正确设置。
   */
  it('应该正确设置所有必填属性', () => {
    const dto = new PasswordIdentifierDTO(
      'testuser@example.com',
      'password123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'web',
    );

    expect(dto.identifier).toBeDefined();
    expect(dto.password).toBeDefined();
    expect(dto.ip).toBeDefined();
    expect(dto.address).toBeDefined();
    expect(dto.userAgent).toBeDefined();
    expect(dto.requestId).toBeDefined();
    expect(dto.type).toBeDefined();
  });
});

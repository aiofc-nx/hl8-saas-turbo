import { RefreshTokenDTO } from './refresh-token.dto';

/**
 * RefreshTokenDTO 单元测试
 *
 * @description
 * 测试刷新令牌数据传输对象的构造函数和属性设置。
 */
describe('RefreshTokenDTO', () => {
  /**
   * 应该正确创建 DTO 实例
   *
   * 验证当提供所有必填参数时，DTO 能够正确创建并设置属性。
   */
  it('应该正确创建 DTO 实例', () => {
    const dto = new RefreshTokenDTO(
      'refresh-token-123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'web',
    );

    expect(dto.refreshToken).toBe('refresh-token-123');
    expect(dto.ip).toBe('192.168.1.1');
    expect(dto.region).toBe('北京市');
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
    const dto = new RefreshTokenDTO(
      'refresh-token-123',
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
    const dto = new RefreshTokenDTO(
      'refresh-token-123',
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
   * 应该正确设置所有必填属性
   *
   * 验证所有必填属性都能正确设置。
   */
  it('应该正确设置所有必填属性', () => {
    const dto = new RefreshTokenDTO(
      'refresh-token-123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'web',
    );

    expect(dto.refreshToken).toBeDefined();
    expect(dto.ip).toBeDefined();
    expect(dto.region).toBeDefined();
    expect(dto.userAgent).toBeDefined();
    expect(dto.requestId).toBeDefined();
    expect(dto.type).toBeDefined();
  });

  /**
   * 应该支持不同的设备类型
   *
   * 验证 DTO 能够支持不同的设备类型（web、mobile、desktop 等）。
   */
  it('应该支持不同的设备类型', () => {
    const webDto = new RefreshTokenDTO(
      'refresh-token-123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'web',
    );
    expect(webDto.type).toBe('web');

    const mobileDto = new RefreshTokenDTO(
      'refresh-token-123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'mobile',
    );
    expect(mobileDto.type).toBe('mobile');

    const desktopDto = new RefreshTokenDTO(
      'refresh-token-123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'desktop',
    );
    expect(desktopDto.type).toBe('desktop');
  });

  /**
   * 应该支持不同的地区格式
   *
   * 验证 DTO 能够支持不同的地区格式。
   */
  it('应该支持不同的地区格式', () => {
    const dto1 = new RefreshTokenDTO(
      'refresh-token-123',
      '192.168.1.1',
      '北京市',
      'Mozilla/5.0',
      'request-123',
      'web',
    );
    expect(dto1.region).toBe('北京市');

    const dto2 = new RefreshTokenDTO(
      'refresh-token-123',
      '192.168.1.1',
      '上海市',
      'Mozilla/5.0',
      'request-123',
      'web',
    );
    expect(dto2.region).toBe('上海市');
  });
});

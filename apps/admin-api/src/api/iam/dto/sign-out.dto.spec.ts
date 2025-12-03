import { validate } from 'class-validator';

import { SignOutDto } from './sign-out.dto';

/**
 * SignOutDto 单元测试
 *
 * 测试用户退出请求数据传输对象的验证逻辑。
 */
describe('SignOutDto', () => {
  /**
   * 应该通过有效数据的验证
   *
   * 验证当提供有效的刷新令牌时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证', async () => {
    const dto = new SignOutDto();
    dto.refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝空刷新令牌
   *
   * 验证当刷新令牌为空字符串时，DTO 验证失败。
   */
  it('应该拒绝空刷新令牌', async () => {
    const dto = new SignOutDto();
    dto.refreshToken = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('refreshToken');
  });

  /**
   * 应该拒绝缺失刷新令牌字段
   *
   * 验证当刷新令牌字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失刷新令牌字段', async () => {
    const dto = new SignOutDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('refreshToken');
  });

  /**
   * 应该拒绝非字符串类型的刷新令牌
   *
   * 验证当刷新令牌不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的刷新令牌', async () => {
    const dto = new SignOutDto();
    // @ts-expect-error 测试非字符串类型
    dto.refreshToken = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'refreshToken')).toBe(true);
  });

  /**
   * 应该接受各种格式的刷新令牌字符串
   *
   * 验证当刷新令牌是有效的字符串时，DTO 能够通过验证。
   */
  it('应该接受各种格式的刷新令牌字符串', async () => {
    const validTokens = [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      'simple-token-string',
      'token-with-special-chars-!@#$%',
    ];

    for (const token of validTokens) {
      const dto = new SignOutDto();
      dto.refreshToken = token;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });
});

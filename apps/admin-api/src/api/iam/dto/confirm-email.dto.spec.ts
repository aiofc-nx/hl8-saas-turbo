import { validate } from 'class-validator';

import { ConfirmEmailDto } from './confirm-email.dto';

/**
 * ConfirmEmailDto 单元测试
 *
 * 测试邮箱确认数据传输对象的验证逻辑。
 */
describe('ConfirmEmailDto', () => {
  /**
   * 应该通过有效数据的验证
   *
   * 验证当提供有效的邮箱和 OTP 验证码时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证', async () => {
    const dto = new ConfirmEmailDto();
    dto.email = 'user@example.com';
    dto.token = '123456';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝无效的邮箱格式
   *
   * 验证当邮箱格式不正确时，DTO 验证失败。
   */
  it('应该拒绝无效的邮箱格式', async () => {
    const dto = new ConfirmEmailDto();
    dto.email = 'invalid-email';
    dto.token = '123456';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  /**
   * 应该拒绝空邮箱
   *
   * 验证当邮箱为空字符串时，DTO 验证失败。
   */
  it('应该拒绝空邮箱', async () => {
    const dto = new ConfirmEmailDto();
    dto.email = '';
    dto.token = '123456';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  /**
   * 应该拒绝缺失邮箱字段
   *
   * 验证当邮箱字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失邮箱字段', async () => {
    const dto = new ConfirmEmailDto();
    dto.token = '123456';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  /**
   * 应该拒绝非 6 位数字的验证码
   *
   * 验证当验证码长度不是 6 位时，DTO 验证失败。
   */
  it('应该拒绝非 6 位数字的验证码', async () => {
    const dto = new ConfirmEmailDto();
    dto.email = 'user@example.com';
    dto.token = '12345'; // 5 位

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const tokenError = errors.find((e) => e.property === 'token');
    expect(tokenError).toBeDefined();
  });

  /**
   * 应该拒绝包含非数字字符的验证码
   *
   * 验证当验证码包含非数字字符时，DTO 验证失败。
   */
  it('应该拒绝包含非数字字符的验证码', async () => {
    const dto = new ConfirmEmailDto();
    dto.email = 'user@example.com';
    dto.token = '12345a'; // 包含字母

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const tokenError = errors.find((e) => e.property === 'token');
    expect(tokenError).toBeDefined();
  });

  /**
   * 应该接受 6 位数字验证码
   *
   * 验证当验证码是 6 位数字时，DTO 能够通过验证。
   */
  it('应该接受 6 位数字验证码', async () => {
    const dto = new ConfirmEmailDto();
    dto.email = 'user@example.com';
    dto.token = '123456';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝空验证码
   *
   * 验证当验证码为空字符串时，DTO 验证失败。
   */
  it('应该拒绝空验证码', async () => {
    const dto = new ConfirmEmailDto();
    dto.email = 'user@example.com';
    dto.token = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'token')).toBe(true);
  });

  /**
   * 应该拒绝缺失验证码字段
   *
   * 验证当验证码字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失验证码字段', async () => {
    const dto = new ConfirmEmailDto();
    dto.email = 'user@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'token')).toBe(true);
  });

  /**
   * 应该拒绝非字符串类型的邮箱
   *
   * 验证当邮箱不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的邮箱', async () => {
    const dto = new ConfirmEmailDto();
    // @ts-expect-error 测试非字符串类型
    dto.email = 123;
    dto.token = '123456';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  /**
   * 应该拒绝非字符串类型的验证码
   *
   * 验证当验证码不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的验证码', async () => {
    const dto = new ConfirmEmailDto();
    dto.email = 'user@example.com';
    // @ts-expect-error 测试非字符串类型
    dto.token = 123456;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'token')).toBe(true);
  });

  /**
   * 应该接受各种有效的邮箱格式
   *
   * 验证当邮箱格式正确时，DTO 能够通过验证。
   */
  it('应该接受各种有效的邮箱格式', async () => {
    const validEmails = [
      'user@example.com',
      'test.user@example.co.uk',
      'user+tag@example.com',
    ];

    for (const email of validEmails) {
      const dto = new ConfirmEmailDto();
      dto.email = email;
      dto.token = '123456';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });
});

import { validate } from 'class-validator';

import { ResendConfirmationEmailDto } from './resend-confirmation-email.dto';

/**
 * ResendConfirmationEmailDto 单元测试
 *
 * 测试重发确认邮件数据传输对象的验证逻辑。
 */
describe('ResendConfirmationEmailDto', () => {
  /**
   * 应该通过有效数据的验证
   *
   * 验证当提供有效的邮箱地址时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证', async () => {
    const dto = new ResendConfirmationEmailDto();
    dto.email = 'user@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝无效的邮箱格式
   *
   * 验证当邮箱格式不正确时，DTO 验证失败。
   */
  it('应该拒绝无效的邮箱格式', async () => {
    const dto = new ResendConfirmationEmailDto();
    dto.email = 'invalid-email';

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
    const dto = new ResendConfirmationEmailDto();
    dto.email = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  /**
   * 应该拒绝缺失邮箱字段
   *
   * 验证当邮箱字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失邮箱字段', async () => {
    const dto = new ResendConfirmationEmailDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  /**
   * 应该接受有效的邮箱格式
   *
   * 验证当邮箱格式正确时，DTO 能够通过验证。
   */
  it('应该接受有效的邮箱格式', async () => {
    const validEmails = [
      'user@example.com',
      'test.user@example.co.uk',
      'user+tag@example.com',
      'user_name@example-domain.com',
    ];

    for (const email of validEmails) {
      const dto = new ResendConfirmationEmailDto();
      dto.email = email;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  /**
   * 应该拒绝非字符串类型的邮箱
   *
   * 验证当邮箱不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的邮箱', async () => {
    const dto = new ResendConfirmationEmailDto();
    // @ts-expect-error 测试非字符串类型
    dto.email = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });
});

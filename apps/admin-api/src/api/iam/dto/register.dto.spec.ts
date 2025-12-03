import { validate } from 'class-validator';

import { RegisterDto } from './register.dto';

/**
 * RegisterDto 单元测试
 *
 * @description
 * 测试用户注册数据传输对象的验证规则。
 */
describe('RegisterDto', () => {
  /**
   * 应该通过验证当只提供必填字段时
   *
   * 验证当只提供必填字段（邮箱和密码）时，DTO 能够通过验证。
   */
  it('应该通过验证当只提供必填字段时', async () => {
    const dto = new RegisterDto();
    dto.email = 'user@example.com';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当提供所有字段时
   *
   * 验证当提供所有字段（包括可选字段）时，DTO 能够通过验证。
   */
  it('应该通过验证当提供所有字段时', async () => {
    const dto = new RegisterDto();
    dto.email = 'user@example.com';
    dto.password = 'password123';
    dto.username = 'testuser';
    dto.nickName = '测试用户';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该验证失败当邮箱缺失时
   *
   * 验证当邮箱字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当邮箱缺失时', async () => {
    const dto = new RegisterDto();
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  /**
   * 应该验证失败当邮箱格式不正确时
   *
   * 验证当邮箱格式不正确时，DTO 验证应该失败。
   */
  it('应该验证失败当邮箱格式不正确时', async () => {
    const dto = new RegisterDto();
    dto.email = 'invalid-email';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });

  /**
   * 应该验证失败当密码缺失时
   *
   * 验证当密码字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当密码缺失时', async () => {
    const dto = new RegisterDto();
    dto.email = 'user@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  /**
   * 应该验证失败当密码长度不足时
   *
   * 验证当密码长度小于 6 个字符时，DTO 验证应该失败。
   */
  it('应该验证失败当密码长度不足时', async () => {
    const dto = new RegisterDto();
    dto.email = 'user@example.com';
    dto.password = '12345'; // 长度不足 6

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  /**
   * 应该验证失败当用户名长度不足时
   *
   * 验证当提供了用户名但长度小于 6 个字符时，DTO 验证应该失败。
   */
  it('应该验证失败当用户名长度不足时', async () => {
    const dto = new RegisterDto();
    dto.email = 'user@example.com';
    dto.password = 'password123';
    dto.username = 'test'; // 长度不足 6

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const usernameError = errors.find((e) => e.property === 'username');
    expect(usernameError).toBeDefined();
  });

  /**
   * 应该通过验证当不提供可选字段时
   *
   * 验证当不提供可选字段（用户名和昵称）时，DTO 能够通过验证。
   */
  it('应该通过验证当不提供可选字段时', async () => {
    const dto = new RegisterDto();
    dto.email = 'user@example.com';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

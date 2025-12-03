import { validate } from 'class-validator';

import { PasswordLoginDto } from './password-login.dto';

/**
 * PasswordLoginDto 单元测试
 *
 * @description
 * 测试密码登录数据传输对象的验证规则。
 */
describe('PasswordLoginDto', () => {
  /**
   * 应该通过验证当所有字段都提供时
   *
   * 验证当提供所有必填字段时，DTO 能够通过验证。
   */
  it('应该通过验证当所有字段都提供时', async () => {
    const dto = new PasswordLoginDto();
    dto.identifier = 'testuser@example.com';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该验证失败当标识符缺失时
   *
   * 验证当标识符字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当标识符缺失时', async () => {
    const dto = new PasswordLoginDto();
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'identifier')).toBe(true);
  });

  /**
   * 应该验证失败当标识符长度不足时
   *
   * 验证当标识符长度小于 6 个字符时，DTO 验证应该失败。
   */
  it('应该验证失败当标识符长度不足时', async () => {
    const dto = new PasswordLoginDto();
    dto.identifier = 'test'; // 长度不足 6
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const identifierError = errors.find((e) => e.property === 'identifier');
    expect(identifierError).toBeDefined();
  });

  /**
   * 应该验证失败当密码缺失时
   *
   * 验证当密码字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当密码缺失时', async () => {
    const dto = new PasswordLoginDto();
    dto.identifier = 'testuser@example.com';

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
    const dto = new PasswordLoginDto();
    dto.identifier = 'testuser@example.com';
    dto.password = '12345'; // 长度不足 6

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });
});

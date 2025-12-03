import { validate } from 'class-validator';

import { UserCreateDto, UserUpdateDto } from './user.dto';

/**
 * UserCreateDto 单元测试
 *
 * @description
 * 测试用户创建数据传输对象的验证规则。
 */
describe('UserCreateDto', () => {
  /**
   * 应该通过验证当所有必填字段都提供时
   *
   * 验证当提供所有必填字段时，DTO 能够通过验证。
   */
  it('应该通过验证当所有必填字段都提供时', async () => {
    const dto = new UserCreateDto();
    dto.username = 'testuser';
    dto.password = 'password123';
    dto.domain = 'example.com';
    dto.nickName = '测试用户';
    dto.avatar = null;
    dto.email = null;
    dto.phoneNumber = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当所有字段都提供时
   *
   * 验证当提供所有字段（包括可选字段）时，DTO 能够通过验证。
   */
  it('应该通过验证当所有字段都提供时', async () => {
    const dto = new UserCreateDto();
    dto.username = 'testuser';
    dto.password = 'password123';
    dto.domain = 'example.com';
    dto.nickName = '测试用户';
    dto.avatar = 'https://example.com/avatar.jpg';
    dto.email = 'test@example.com';
    dto.phoneNumber = '13800138000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该验证失败当用户名缺失时
   *
   * 验证当用户名字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当用户名缺失时', async () => {
    const dto = new UserCreateDto();
    dto.password = 'password123';
    dto.domain = 'example.com';
    dto.nickName = '测试用户';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'username')).toBe(true);
  });

  /**
   * 应该验证失败当用户名长度不足时
   *
   * 验证当用户名长度小于 6 个字符时，DTO 验证应该失败。
   */
  it('应该验证失败当用户名长度不足时', async () => {
    const dto = new UserCreateDto();
    dto.username = 'test'; // 长度不足 6
    dto.password = 'password123';
    dto.domain = 'example.com';
    dto.nickName = '测试用户';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const usernameError = errors.find((e) => e.property === 'username');
    expect(usernameError).toBeDefined();
  });

  /**
   * 应该验证失败当密码缺失时
   *
   * 验证当密码字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当密码缺失时', async () => {
    const dto = new UserCreateDto();
    dto.username = 'testuser';
    dto.domain = 'example.com';
    dto.nickName = '测试用户';

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
    const dto = new UserCreateDto();
    dto.username = 'testuser';
    dto.password = '12345'; // 长度不足 6
    dto.domain = 'example.com';
    dto.nickName = '测试用户';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  /**
   * 应该验证失败当域缺失时
   *
   * 验证当域字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当域缺失时', async () => {
    const dto = new UserCreateDto();
    dto.username = 'testuser';
    dto.password = 'password123';
    dto.nickName = '测试用户';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'domain')).toBe(true);
  });

  /**
   * 应该验证失败当昵称缺失时
   *
   * 验证当昵称字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当昵称缺失时', async () => {
    const dto = new UserCreateDto();
    dto.username = 'testuser';
    dto.password = 'password123';
    dto.domain = 'example.com';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'nickName')).toBe(true);
  });
});

/**
 * UserUpdateDto 单元测试
 *
 * @description
 * 测试用户更新数据传输对象的验证规则。
 */
describe('UserUpdateDto', () => {
  /**
   * 应该通过验证当所有必填字段都提供时
   *
   * 验证当提供所有必填字段时，DTO 能够通过验证。
   */
  it('应该通过验证当所有必填字段都提供时', async () => {
    const dto = new UserUpdateDto();
    dto.id = 'user-123';
    dto.username = 'testuser';
    dto.nickName = '测试用户';
    dto.avatar = null;
    dto.email = null;
    dto.phoneNumber = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该验证失败当 ID 缺失时
   *
   * 验证当用户 ID 字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当 ID 缺失时', async () => {
    const dto = new UserUpdateDto();
    dto.username = 'testuser';
    dto.nickName = '测试用户';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'id')).toBe(true);
  });

  /**
   * 应该不包含密码和域字段
   *
   * 验证 UserUpdateDto 不包含密码和域字段（继承时已排除）。
   */
  it('应该不包含密码和域字段', () => {
    const dto = new UserUpdateDto();
    expect('password' in dto).toBe(false);
    expect('domain' in dto).toBe(false);
  });
});

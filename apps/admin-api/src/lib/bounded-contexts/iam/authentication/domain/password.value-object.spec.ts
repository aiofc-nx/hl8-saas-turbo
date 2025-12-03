import * as bcrypt from 'bcryptjs';

import { Password } from './password.value-object';

/**
 * Password 值对象单元测试
 *
 * 测试密码值对象的加密、验证和存储逻辑。
 */
describe('Password', () => {
  /**
   * 应该从明文密码创建密码值对象
   *
   * 验证使用 hash 方法能够正确创建加密后的密码值对象。
   */
  it('应该从明文密码创建密码值对象', async () => {
    const plainPassword = 'testPassword123';
    const password = await Password.hash(plainPassword);

    expect(password).toBeInstanceOf(Password);
    expect(password.getValue()).not.toBe(plainPassword);
    expect(password.getValue().length).toBeGreaterThan(0);
  });

  /**
   * 应该从已哈希的密码创建密码值对象
   *
   * 验证使用 fromHashed 方法能够从已加密的密码创建值对象。
   */
  it('应该从已哈希的密码创建密码值对象', () => {
    const hashedPassword = '$2a$10$exampleHashedPasswordString';
    const password = Password.fromHashed(hashedPassword);

    expect(password).toBeInstanceOf(Password);
    expect(password.getValue()).toBe(hashedPassword);
  });

  /**
   * 应该正确比较匹配的密码
   *
   * 验证当提供的明文密码与哈希值匹配时，compare 方法返回 true。
   */
  it('应该正确比较匹配的密码', async () => {
    const plainPassword = 'testPassword123';
    const password = await Password.hash(plainPassword);

    const result = await password.compare(plainPassword);
    expect(result).toBe(true);
  });

  /**
   * 应该正确比较不匹配的密码
   *
   * 验证当提供的明文密码与哈希值不匹配时，compare 方法返回 false。
   */
  it('应该正确比较不匹配的密码', async () => {
    const plainPassword = 'testPassword123';
    const wrongPassword = 'wrongPassword';
    const password = await Password.hash(plainPassword);

    const result = await password.compare(wrongPassword);
    expect(result).toBe(false);
  });

  /**
   * 应该为相同明文密码生成不同的哈希值
   *
   * 验证 bcrypt 的盐值机制确保每次哈希都生成不同的结果。
   */
  it('应该为相同明文密码生成不同的哈希值', async () => {
    const plainPassword = 'testPassword123';
    const password1 = await Password.hash(plainPassword);
    const password2 = await Password.hash(plainPassword);

    expect(password1.getValue()).not.toBe(password2.getValue());
    // 但两者都应该能够验证相同的明文密码
    expect(await password1.compare(plainPassword)).toBe(true);
    expect(await password2.compare(plainPassword)).toBe(true);
  });

  /**
   * 应该能够验证从哈希值创建的密码
   *
   * 验证从已哈希的密码创建的值对象能够正确验证原始明文密码。
   */
  it('应该能够验证从哈希值创建的密码', async () => {
    const plainPassword = 'testPassword123';
    const hashedPassword = await bcrypt.hash(
      plainPassword,
      await bcrypt.genSalt(),
    );
    const password = Password.fromHashed(hashedPassword);

    const result = await password.compare(plainPassword);
    expect(result).toBe(true);
  });

  /**
   * 应该拒绝错误的密码验证
   *
   * 验证从哈希值创建的密码值对象能够正确拒绝错误的明文密码。
   */
  it('应该拒绝错误的密码验证', async () => {
    const plainPassword = 'testPassword123';
    const wrongPassword = 'wrongPassword';
    const hashedPassword = await bcrypt.hash(
      plainPassword,
      await bcrypt.genSalt(),
    );
    const password = Password.fromHashed(hashedPassword);

    const result = await password.compare(wrongPassword);
    expect(result).toBe(false);
  });

  /**
   * 应该返回正确的哈希值
   *
   * 验证 getValue 方法返回正确的密码哈希值。
   */
  it('应该返回正确的哈希值', async () => {
    const plainPassword = 'testPassword123';
    const password = await Password.hash(plainPassword);
    const value = password.getValue();

    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
    expect(value).toMatch(/^\$2[aby]\$/); // bcrypt 哈希值格式
  });

  /**
   * 应该处理空字符串密码
   *
   * 验证能够处理空字符串密码（虽然不推荐，但应该能够正常工作）。
   */
  it('应该处理空字符串密码', async () => {
    const plainPassword = '';
    const password = await Password.hash(plainPassword);

    expect(password).toBeInstanceOf(Password);
    const result = await password.compare(plainPassword);
    expect(result).toBe(true);
  });

  /**
   * 应该处理特殊字符密码
   *
   * 验证能够正确处理包含特殊字符的密码。
   */
  it('应该处理特殊字符密码', async () => {
    const plainPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const password = await Password.hash(plainPassword);

    expect(password).toBeInstanceOf(Password);
    const result = await password.compare(plainPassword);
    expect(result).toBe(true);
  });

  /**
   * 应该处理长密码
   *
   * 验证能够正确处理较长的密码字符串。
   */
  it('应该处理长密码', async () => {
    const plainPassword = 'a'.repeat(100);
    const password = await Password.hash(plainPassword);

    expect(password).toBeInstanceOf(Password);
    const result = await password.compare(plainPassword);
    expect(result).toBe(true);
  });

  /**
   * 应该处理 Unicode 字符密码
   *
   * 验证能够正确处理包含 Unicode 字符的密码。
   */
  it('应该处理 Unicode 字符密码', async () => {
    const plainPassword = '密码123🔐';
    const password = await Password.hash(plainPassword);

    expect(password).toBeInstanceOf(Password);
    const result = await password.compare(plainPassword);
    expect(result).toBe(true);
  });
});

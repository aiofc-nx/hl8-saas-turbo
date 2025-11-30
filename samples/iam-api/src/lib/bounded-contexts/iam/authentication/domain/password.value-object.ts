import * as bcrypt from 'bcryptjs';

/**
 * 密码值对象
 *
 * @description
 * 密码的值对象，封装密码的加密、验证和存储逻辑。
 * 值对象是不可变的，确保密码的安全性。
 * 使用 bcrypt 进行密码哈希和验证。
 */
export class Password {
  /**
   * 密码值
   *
   * @description 加密后的密码哈希值，私有字段，不允许直接访问
   */
  private readonly value: string;

  /**
   * 私有构造函数
   *
   * @description 防止直接实例化，必须通过静态工厂方法创建
   *
   * @param value - 密码哈希值
   */
  private constructor(value: string) {
    this.value = value;
  }

  /**
   * 从明文密码创建密码值对象
   *
   * @description
   * 使用 bcrypt 对明文密码进行哈希加密，生成密码值对象。
   * 这是创建新密码的标准方式。
   *
   * @param password - 明文密码
   * @returns 返回加密后的密码值对象
   */
  static async hash(password: string): Promise<Password> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    return new Password(hashedPassword);
  }

  /**
   * 从已哈希的密码创建密码值对象
   *
   * @description
   * 从数据库中读取的已加密密码创建密码值对象。
   * 用于从持久化数据恢复密码值对象。
   *
   * @param password - 已加密的密码哈希值
   * @returns 返回密码值对象
   */
  static fromHashed(password: string): Password {
    return new Password(password);
  }

  /**
   * 比较密码
   *
   * @description
   * 使用 bcrypt 比较提供的明文密码是否与存储的哈希值匹配。
   * 用于用户登录时的密码验证。
   *
   * @param password - 要验证的明文密码
   * @returns 返回比较结果，true 表示密码匹配
   */
  async compare(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.value);
  }

  /**
   * 获取密码哈希值
   *
   * @description 获取密码的哈希值，用于持久化到数据库
   *
   * @returns 返回密码的哈希值
   */
  getValue(): string {
    return this.value;
  }
}

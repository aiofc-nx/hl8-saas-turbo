/**
 * 签名算法枚举
 *
 * @description 定义签名请求支持的哈希算法类型。不同的算法有不同的安全性和性能特性。
 *
 * @enum {string}
 *
 * @property {string} MD5 - MD5 哈希算法，性能较高但安全性较低，不推荐用于生产环境
 * @property {string} SHA1 - SHA-1 哈希算法，性能适中，已逐渐被淘汰，不推荐用于新项目
 * @property {string} SHA256 - SHA-256 哈希算法，安全性和性能平衡，推荐使用
 * @property {string} HMAC_SHA256 - HMAC-SHA256 算法，最高安全性，强烈推荐用于生产环境
 *
 * @example
 * ```typescript
 * // 在签名请求中使用
 * const algorithm = SignatureAlgorithm.HMAC_SHA256;
 *
 * // 验证算法是否支持
 * if (Object.values(SignatureAlgorithm).includes(algorithm)) {
 *   // 算法受支持
 * }
 * ```
 */
export enum SignatureAlgorithm {
  /** MD5 哈希算法 */
  MD5 = 'MD5',
  /** SHA-1 哈希算法 */
  SHA1 = 'SHA1',
  /** SHA-256 哈希算法 */
  SHA256 = 'SHA256',
  /** HMAC-SHA256 算法 */
  HMAC_SHA256 = 'HMAC_SHA256',
}

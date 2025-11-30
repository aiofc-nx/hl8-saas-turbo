/**
 * 登录日志写入仓储端口令牌
 *
 * @description 用于依赖注入的符号令牌，标识登录日志写入仓储端口的实现。
 * 该令牌用于在NestJS的依赖注入容器中注册和解析LoginLogWriteRepoPort接口的实现。
 */
export const LoginLogWriteRepoPortToken = Symbol('LoginLogWriteRepoPort');

/**
 * 登录日志读取仓储端口令牌
 *
 * @description 用于依赖注入的符号令牌，标识登录日志读取仓储端口的实现。
 * 该令牌用于在NestJS的依赖注入容器中注册和解析LoginLogReadRepoPort接口的实现。
 */
export const LoginLogReadRepoPortToken = Symbol('LoginLogReadRepoPort');

/**
 * 操作日志写入仓储端口令牌
 *
 * @description 用于依赖注入的符号令牌，标识操作日志写入仓储端口的实现。
 * 该令牌用于在NestJS的依赖注入容器中注册和解析OperationLogWriteRepoPort接口的实现。
 */
export const OperationLogWriteRepoPortToken = Symbol(
  'OperationLogWriteRepoPort',
);

/**
 * 操作日志读取仓储端口令牌
 *
 * @description 用于依赖注入的符号令牌，标识操作日志读取仓储端口的实现。
 * 该令牌用于在NestJS的依赖注入容器中注册和解析OperationLogReadRepoPort接口的实现。
 */
export const OperationLogReadRepoPortToken = Symbol('OperationLogReadRepoPort');

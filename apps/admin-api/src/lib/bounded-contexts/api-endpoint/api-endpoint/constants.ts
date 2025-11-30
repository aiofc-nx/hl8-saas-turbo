/**
 * API 端点写入仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识 API 端点写入仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const ApiEndpointWriteRepoPortToken = Symbol('ApiEndpointWriteRepoPort');

/**
 * API 端点读取仓储端口令牌
 *
 * @description
 * 用于依赖注入的符号令牌，标识 API 端点读取仓储端口的实现。
 * 在基础设施层注册时使用此令牌。
 */
export const ApiEndpointReadRepoPortToken = Symbol('ApiEndpointReadRepoPort');

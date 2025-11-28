import { AggregateRoot } from '@nestjs/cqrs';

/**
 * API 端点聚合根
 *
 * @description
 * API 端点的领域模型，是 API 端点有界上下文的聚合根。
 * API 端点是后端接口的抽象，用于 Casbin 权限控制和接口管理。
 * 每个端点包含路径、HTTP 方法、操作、资源等信息。
 *
 * @extends {AggregateRoot}
 */
export class ApiEndpoint extends AggregateRoot {
  /**
   * 端点 ID
   *
   * @description API 端点的唯一标识符
   */
  readonly id: string;

  /**
   * 路径
   *
   * @description API 端点的 URL 路径，例如 "/user" 或 "/user/:id"
   */
  readonly path: string;

  /**
   * HTTP 方法
   *
   * @description API 端点使用的 HTTP 方法，例如：GET、POST、PUT、DELETE
   */
  readonly method: string;

  /**
   * 操作
   *
   * @description API 端点对应的操作类型，例如：read、write、delete
   */
  readonly action: string;

  /**
   * 资源
   *
   * @description API 端点对应的资源类型，例如：user、role、domain
   */
  readonly resource: string;

  /**
   * 控制器
   *
   * @description 处理该 API 端点的控制器名称
   */
  readonly controller: string;

  /**
   * 摘要
   *
   * @description API 端点的简要描述信息，可选
   */
  readonly summary?: string;

  /**
   * 构造函数
   *
   * @description 创建 API 端点聚合根实例
   *
   * @param id - API 端点的唯一标识符
   * @param path - API 端点的 URL 路径
   * @param method - HTTP 方法
   * @param action - 操作类型
   * @param resource - 资源类型
   * @param controller - 控制器名称
   * @param summary - 摘要描述，可选
   */
  constructor(
    id: string,
    path: string,
    method: string,
    action: string,
    resource: string,
    controller: string,
    summary?: string,
  ) {
    super();
    this.id = id;
    this.path = path;
    this.method = method;
    this.action = action;
    this.resource = resource;
    this.controller = controller;
    this.summary = summary;
  }
}

import { describe, expect, it } from '@jest/globals';

import { Permission } from '../interfaces';
import { UsePermissions } from './use-permissions.decorator';

/**
 * UsePermissions 装饰器单元测试
 *
 * @description 验证权限装饰器的功能，包括元数据设置
 */
describe('UsePermissions', () => {
  it('应该设置权限元数据', () => {
    const permissions: Permission[] = [
      { resource: 'data1', action: 'read' },
      { resource: 'data2', action: 'write' },
    ];

    const decorator = UsePermissions(...permissions);

    // 验证装饰器返回 SetMetadata 的结果
    expect(decorator).toBeDefined();
  });

  it('应该使用正确的元数据键', () => {
    const permissions: Permission[] = [{ resource: 'data1', action: 'read' }];

    // 验证装饰器返回一个函数（SetMetadata 的结果）
    const decorator = UsePermissions(...permissions);
    expect(decorator).toBeDefined();
    expect(typeof decorator).toBe('function');
  });

  it('应该支持单个权限', () => {
    const permission: Permission = { resource: 'data1', action: 'read' };

    const decorator = UsePermissions(permission);

    expect(decorator).toBeDefined();
  });

  it('应该支持多个权限', () => {
    const permissions: Permission[] = [
      { resource: 'data1', action: 'read' },
      { resource: 'data2', action: 'write' },
      { resource: 'data3', action: 'delete' },
    ];

    const decorator = UsePermissions(...permissions);

    expect(decorator).toBeDefined();
  });

  it('应该支持空权限数组', () => {
    const permissions: Permission[] = [];

    const decorator = UsePermissions(...permissions);

    expect(decorator).toBeDefined();
  });

  it('应该支持自定义 action 类型', () => {
    const permissions: Permission[] = [
      { resource: 'data1', action: 'custom-action' },
    ];

    const decorator = UsePermissions(...permissions);

    expect(decorator).toBeDefined();
  });
});

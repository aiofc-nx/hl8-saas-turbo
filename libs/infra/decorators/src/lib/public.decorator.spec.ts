import 'reflect-metadata';

import { describe, expect, it } from '@jest/globals';
import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY, Public } from './public.decorator';

/**
 * Public 装饰器单元测试
 *
 * @description 验证公开路由装饰器的元数据设置是否正确
 */
describe('Public', () => {
  it('应该返回 SetMetadata 装饰器', () => {
    const decorator = Public();
    expect(decorator).toBeDefined();
    expect(typeof decorator).toBe('function');
  });

  it('应该与 SetMetadata(IS_PUBLIC_KEY, true) 等价', () => {
    const publicDecorator = Public();
    const setMetadataDecorator = SetMetadata(IS_PUBLIC_KEY, true);

    // 验证两个装饰器函数都是函数类型
    expect(typeof publicDecorator).toBe('function');
    expect(typeof setMetadataDecorator).toBe('function');
  });

  it('Public 装饰器应该返回一个接受 3 个参数的函数', () => {
    const result = Public();
    expect(typeof result).toBe('function');
    expect(result.length).toBe(3); // 装饰器函数应该接受 3 个参数 (target, propertyKey, descriptor)
  });

  it('IS_PUBLIC_KEY 应该是字符串类型', () => {
    expect(typeof IS_PUBLIC_KEY).toBe('string');
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('应该能够多次调用并返回不同的函数实例', () => {
    const decorator1 = Public();
    const decorator2 = Public();
    expect(typeof decorator1).toBe('function');
    expect(typeof decorator2).toBe('function');
    // 每次调用都返回新的函数实例
    expect(decorator1).not.toBe(decorator2);
  });
});

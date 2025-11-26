import 'reflect-metadata';

import { describe, expect, it } from '@jest/globals';
import { SetMetadata } from '@nestjs/common';

import {
  BYPASS_TRANSFORM_KEY,
  BypassTransform,
} from './bypass-transform.decorator';

/**
 * BypassTransform 装饰器单元测试
 *
 * @description 验证跳过转换装饰器的元数据设置是否正确
 */
describe('BypassTransform', () => {
  it('应该返回 SetMetadata 装饰器', () => {
    const decorator = BypassTransform();
    expect(decorator).toBeDefined();
    expect(typeof decorator).toBe('function');
  });

  it('应该与 SetMetadata(BYPASS_TRANSFORM_KEY, true) 等价', () => {
    const bypassDecorator = BypassTransform();
    const setMetadataDecorator = SetMetadata(BYPASS_TRANSFORM_KEY, true);

    // 验证两个装饰器函数都是函数类型
    expect(typeof bypassDecorator).toBe('function');
    expect(typeof setMetadataDecorator).toBe('function');
  });

  it('BypassTransform 装饰器应该返回一个接受 3 个参数的函数', () => {
    const result = BypassTransform();
    expect(typeof result).toBe('function');
    expect(result.length).toBe(3); // 装饰器函数应该接受 3 个参数
  });

  it('BYPASS_TRANSFORM_KEY 应该是字符串类型', () => {
    expect(typeof BYPASS_TRANSFORM_KEY).toBe('string');
    expect(BYPASS_TRANSFORM_KEY).toBe('bypassTransform');
  });

  it('应该能够多次调用并返回不同的函数实例', () => {
    const decorator1 = BypassTransform();
    const decorator2 = BypassTransform();
    expect(typeof decorator1).toBe('function');
    expect(typeof decorator2).toBe('function');
    // 每次调用都返回新的函数实例
    expect(decorator1).not.toBe(decorator2);
  });
});

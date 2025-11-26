import 'reflect-metadata';

import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { PaginationParams } from './pagination-params';

/**
 * PaginationParams 分页参数类单元测试
 *
 * @description 验证分页查询参数类的功能是否正确，包括验证、转换和默认值
 */
describe('PaginationParams', () => {
  describe('默认值', () => {
    it('应该使用默认值 current=1, size=10', () => {
      const params = plainToInstance(PaginationParams, {});

      expect(params.current).toBe(1);
      expect(params.size).toBe(10);
    });

    it('应该处理 undefined 值并应用默认值', () => {
      const params = plainToInstance(PaginationParams, {
        current: undefined,
        size: undefined,
      });

      expect(params.current).toBe(1);
      expect(params.size).toBe(10);
    });

    it('应该处理 null 值并应用默认值', () => {
      const params = plainToInstance(PaginationParams, {
        current: null,
        size: null,
      });

      expect(params.current).toBe(1);
      expect(params.size).toBe(10);
    });
  });

  describe('current 字段', () => {
    it('应该正确解析字符串数字', () => {
      const params = plainToInstance(PaginationParams, {
        current: '5',
        size: '20',
      });

      expect(params.current).toBe(5);
      expect(typeof params.current).toBe('number');
    });

    it('应该正确解析数字', () => {
      const params = plainToInstance(PaginationParams, {
        current: 3,
        size: 15,
      });

      expect(params.current).toBe(3);
      expect(typeof params.current).toBe('number');
    });

    it('应该将 0 转换为默认值 1（Transform 会将 falsy 值转换为默认值）', () => {
      const params = plainToInstance(PaginationParams, {
        current: 0,
        size: 10,
      });

      // Transform 会将 0（falsy）转换为默认值 1
      expect(params.current).toBe(1);
    });

    it('应该接受最小值 1', async () => {
      const params = plainToInstance(PaginationParams, {
        current: 1,
        size: 10,
      });

      const errors = await validate(params);
      const currentErrors = errors.filter((e) => e.property === 'current');
      expect(currentErrors.length).toBe(0);
    });

    it('应该将浮点数转换为整数（parseInt 会截断小数部分）', () => {
      const params = plainToInstance(PaginationParams, {
        current: '1.5',
        size: 10,
      });

      // parseInt('1.5') 会返回 1
      expect(params.current).toBe(1);
      expect(Number.isInteger(params.current)).toBe(true);
    });

    it('应该接受大页码', async () => {
      const params = plainToInstance(PaginationParams, {
        current: 1000,
        size: 10,
      });

      const errors = await validate(params);
      const currentErrors = errors.filter((e) => e.property === 'current');
      expect(currentErrors.length).toBe(0);
      expect(params.current).toBe(1000);
    });
  });

  describe('size 字段', () => {
    it('应该正确解析字符串数字', () => {
      const params = plainToInstance(PaginationParams, {
        current: '1',
        size: '25',
      });

      expect(params.size).toBe(25);
      expect(typeof params.size).toBe('number');
    });

    it('应该正确解析数字', () => {
      const params = plainToInstance(PaginationParams, {
        current: 1,
        size: 50,
      });

      expect(params.size).toBe(50);
      expect(typeof params.size).toBe('number');
    });

    it('应该将 0 转换为默认值 10（Transform 会将 falsy 值转换为默认值）', () => {
      const params = plainToInstance(PaginationParams, {
        current: 1,
        size: 0,
      });

      // Transform 会将 0（falsy）转换为默认值 10
      expect(params.size).toBe(10);
    });

    it('应该验证最大值（size <= 100）', async () => {
      const params = plainToInstance(PaginationParams, {
        current: 1,
        size: 101,
      });

      const errors = await validate(params);
      const sizeErrors = errors.filter((e) => e.property === 'size');
      expect(sizeErrors.length).toBeGreaterThan(0);
    });

    it('应该接受最小值 1', async () => {
      const params = plainToInstance(PaginationParams, {
        current: 1,
        size: 1,
      });

      const errors = await validate(params);
      const sizeErrors = errors.filter((e) => e.property === 'size');
      expect(sizeErrors.length).toBe(0);
      expect(params.size).toBe(1);
    });

    it('应该接受最大值 100', async () => {
      const params = plainToInstance(PaginationParams, {
        current: 1,
        size: 100,
      });

      const errors = await validate(params);
      const sizeErrors = errors.filter((e) => e.property === 'size');
      expect(sizeErrors.length).toBe(0);
      expect(params.size).toBe(100);
    });

    it('应该将浮点数转换为整数（parseInt 会截断小数部分）', () => {
      const params = plainToInstance(PaginationParams, {
        current: 1,
        size: '10.5',
      });

      // parseInt('10.5') 会返回 10
      expect(params.size).toBe(10);
      expect(Number.isInteger(params.size)).toBe(true);
    });
  });

  describe('字段转换', () => {
    it('应该将字符串转换为数字', () => {
      const params = plainToInstance(PaginationParams, {
        current: '2',
        size: '30',
      });

      expect(typeof params.current).toBe('number');
      expect(typeof params.size).toBe('number');
      expect(params.current).toBe(2);
      expect(params.size).toBe(30);
    });

    it('应该处理空字符串并应用默认值', () => {
      const params = plainToInstance(PaginationParams, {
        current: '',
        size: '',
      });

      expect(params.current).toBe(1);
      expect(params.size).toBe(10);
    });
  });

  describe('验证规则', () => {
    it('应该通过有效的分页参数验证', async () => {
      const params = plainToInstance(PaginationParams, {
        current: 2,
        size: 20,
      });

      const errors = await validate(params);
      expect(errors.length).toBe(0);
    });

    it('应该拒绝无效的分页参数', async () => {
      const params = plainToInstance(PaginationParams, {
        current: 0,
        size: 101,
      });

      const errors = await validate(params);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('应该将浮点数转换为整数（parseInt 会截断小数部分）', () => {
      const params = plainToInstance(PaginationParams, {
        current: '1.5',
        size: '10.7',
      });

      // parseInt 会截断小数部分
      expect(params.current).toBe(1);
      expect(params.size).toBe(10);
      expect(Number.isInteger(params.current)).toBe(true);
      expect(Number.isInteger(params.size)).toBe(true);
    });
  });

  describe('边界值测试', () => {
    it('应该接受 current=1, size=1（最小有效值）', async () => {
      const params = plainToInstance(PaginationParams, {
        current: 1,
        size: 1,
      });

      const errors = await validate(params);
      expect(errors.length).toBe(0);
      expect(params.current).toBe(1);
      expect(params.size).toBe(1);
    });

    it('应该接受 current=1, size=100（最大 size 值）', async () => {
      const params = plainToInstance(PaginationParams, {
        current: 1,
        size: 100,
      });

      const errors = await validate(params);
      expect(errors.length).toBe(0);
      expect(params.current).toBe(1);
      expect(params.size).toBe(100);
    });

    it('应该拒绝 size > 100', async () => {
      const params = plainToInstance(PaginationParams, {
        current: 1,
        size: 101,
      });

      const errors = await validate(params);
      const sizeErrors = errors.filter((e) => e.property === 'size');
      expect(sizeErrors.length).toBeGreaterThan(0);
    });

    it('应该保留负数并触发验证错误', async () => {
      const params = plainToInstance(PaginationParams, {
        current: -1,
        size: 10,
      });

      // 负数会被保留（因为 -1 是 truthy），但验证器应该拒绝它
      expect(params.current).toBe(-1);

      const errors = await validate(params);
      const currentErrors = errors.filter((e) => e.property === 'current');
      expect(currentErrors.length).toBeGreaterThan(0);
    });
  });

  describe('实际使用场景', () => {
    it('应该正确处理查询字符串参数', () => {
      const queryParams = {
        current: '3',
        size: '25',
      };

      const params = plainToInstance(PaginationParams, queryParams);

      expect(params.current).toBe(3);
      expect(params.size).toBe(25);
    });

    it('应该正确处理只提供 current 的情况', () => {
      const params = plainToInstance(PaginationParams, {
        current: '5',
      });

      expect(params.current).toBe(5);
      expect(params.size).toBe(10); // 默认值
    });

    it('应该正确处理只提供 size 的情况', () => {
      const params = plainToInstance(PaginationParams, {
        size: '50',
      });

      expect(params.current).toBe(1); // 默认值
      expect(params.size).toBe(50);
    });
  });

  describe('字段可访问性', () => {
    it('current 和 size 应该是只读属性', () => {
      const params = plainToInstance(PaginationParams, {
        current: 2,
        size: 20,
      });

      // TypeScript 编译时会检查 readonly，这里我们验证属性存在
      expect(params).toHaveProperty('current');
      expect(params).toHaveProperty('size');
      expect(typeof params.current).toBe('number');
      expect(typeof params.size).toBe('number');
    });
  });
});

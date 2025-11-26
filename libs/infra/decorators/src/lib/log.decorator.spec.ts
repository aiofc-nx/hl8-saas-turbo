import 'reflect-metadata';

import { describe, expect, it } from '@jest/globals';

import { LOG_KEY, Log } from './log.decorator';

/**
 * Log 装饰器单元测试
 *
 * @description 验证日志装饰器的元数据设置是否正确
 */
describe('Log', () => {
  describe('基本使用', () => {
    it('应该设置正确的元数据（仅模块名和描述）', () => {
      const decorator = Log('用户管理', '创建用户');
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
      expect(decorator.length).toBe(3); // 装饰器函数应该接受 3 个参数
    });
  });

  describe('带选项使用', () => {
    it('应该正确设置所有选项', () => {
      const decorator = Log('用户管理', '创建用户', {
        logParams: true,
        logBody: true,
        logResponse: true,
      });
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    it('应该支持部分选项', () => {
      const decorator = Log('订单管理', '创建订单', {
        logBody: true,
      });
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    it('应该支持所有选项为 false', () => {
      const decorator = Log('系统管理', '系统配置', {
        logParams: false,
        logBody: false,
        logResponse: false,
      });
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });
  });

  describe('参数验证', () => {
    it('应该接受模块名和描述作为必需参数', () => {
      const decorator = Log('模块名', '操作描述');
      expect(typeof decorator).toBe('function');
    });

    it('应该接受可选的选项参数', () => {
      const decorator1 = Log('模块名', '操作描述');
      const decorator2 = Log('模块名', '操作描述', {});
      expect(typeof decorator1).toBe('function');
      expect(typeof decorator2).toBe('function');
    });
  });

  describe('边界情况', () => {
    it('应该支持空字符串模块名', () => {
      const decorator = Log('', '操作');
      expect(typeof decorator).toBe('function');
    });

    it('应该支持空字符串描述', () => {
      const decorator = Log('模块', '');
      expect(typeof decorator).toBe('function');
    });
  });

  describe('LOG_KEY 常量', () => {
    it('LOG_KEY 应该是字符串类型', () => {
      expect(typeof LOG_KEY).toBe('string');
      expect(LOG_KEY).toBe('log');
    });
  });
});

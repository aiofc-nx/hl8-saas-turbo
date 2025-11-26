import { describe, expect, it } from '@jest/globals';
import ip2region from './ip2region';

describe('ip2region', () => {
  describe('isValidIp', () => {
    it('应该验证有效的 IP 地址', () => {
      const validIps = [
        '0.0.0.0',
        '127.0.0.1',
        '192.168.1.1',
        '255.255.255.255',
        '1.2.3.4',
        '10.0.0.1',
      ];

      validIps.forEach((ip) => {
        expect(ip2region.isValidIp(ip)).toBe(true);
      });
    });

    it('应该拒绝无效的 IP 地址', () => {
      const invalidIps = [
        '',
        'invalid',
        '256.1.1.1',
        '1.256.1.1',
        '1.1.256.1',
        '1.1.1.256',
        '1.1.1',
        '1.1.1.1.1',
        '1.1.1.1.',
        '.1.1.1.1',
        '1.1.1.1a',
        'a1.1.1.1',
      ];

      invalidIps.forEach((ip) => {
        expect(ip2region.isValidIp(ip)).toBe(false);
      });
    });

    it('应该拒绝边界值外的 IP 地址', () => {
      const invalidIps = [
        '256.0.0.0',
        '0.256.0.0',
        '0.0.256.0',
        '0.0.0.256',
        '-1.0.0.0',
        '0.-1.0.0',
      ];

      invalidIps.forEach((ip) => {
        expect(ip2region.isValidIp(ip)).toBe(false);
      });
    });
  });

  describe('newWithBuffer', () => {
    it('应该在提供有效 buffer 时创建 Searcher', () => {
      // Arrange
      const buffer = Buffer.alloc(1024);

      // Act
      const searcher = ip2region.newWithBuffer(buffer);

      // Assert
      expect(searcher).toBeDefined();
    });

    it('应该在 buffer 无效时抛出错误', () => {
      // Arrange
      const invalidBuffer = 'not-a-buffer' as any;

      // Act & Assert
      expect(() => ip2region.newWithBuffer(invalidBuffer)).toThrow(
        'buffer is invalid',
      );
    });
  });

  describe('newWithVectorIndex', () => {
    it('应该是一个函数', () => {
      expect(typeof ip2region.newWithVectorIndex).toBe('function');
    });

    // 注意：newWithVectorIndex 会先检查文件，然后验证 vectorIndex
    // 由于无法 mock fs，参数验证测试需要在集成测试中覆盖
  });

  // 注意：以下函数直接调用 fs 同步方法
  // 在 ESM 模式下，fs 模块是只读的，无法使用 jest.spyOn 进行 mock
  // 这些函数需要实际的数据库文件才能测试，建议在集成测试中覆盖
  describe('newWithFileOnly', () => {
    it('应该是一个函数', () => {
      expect(typeof ip2region.newWithFileOnly).toBe('function');
    });
  });

  describe('loadVectorIndexFromFile', () => {
    it('应该是一个函数', () => {
      expect(typeof ip2region.loadVectorIndexFromFile).toBe('function');
    });
  });

  describe('loadContentFromFile', () => {
    it('应该是一个函数', () => {
      expect(typeof ip2region.loadContentFromFile).toBe('function');
    });
  });
});

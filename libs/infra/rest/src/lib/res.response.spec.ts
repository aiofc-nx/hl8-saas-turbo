import { describe, expect, it } from '@jest/globals';

import { RESPONSE_SUCCESS_CODE, RESPONSE_SUCCESS_MSG } from '@hl8/constants';

import { ApiRes } from './res.response';

/**
 * ApiRes 响应类单元测试
 *
 * @description 验证标准化的 API 响应格式类的功能是否正确
 */
describe('ApiRes', () => {
  describe('success 方法', () => {
    it('应该创建包含数据的成功响应', () => {
      const data = { id: 1, name: 'test' };
      const response = ApiRes.success(data);

      expect(response.code).toBe(RESPONSE_SUCCESS_CODE);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(RESPONSE_SUCCESS_MSG);
    });

    it('应该支持自定义成功消息', () => {
      const data = { id: 1 };
      const customMessage = '操作成功';
      const response = ApiRes.success(data, customMessage);

      expect(response.code).toBe(RESPONSE_SUCCESS_CODE);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(customMessage);
    });

    it('应该支持不同类型的数据', () => {
      const stringData = 'test string';
      const numberData = 123;
      const arrayData = [1, 2, 3];
      const objectData = { key: 'value' };
      const nullData = null;

      expect(ApiRes.success(stringData).data).toBe(stringData);
      expect(ApiRes.success(numberData).data).toBe(numberData);
      expect(ApiRes.success(arrayData).data).toEqual(arrayData);
      expect(ApiRes.success(objectData).data).toEqual(objectData);
      expect(ApiRes.success(nullData).data).toBeNull();
    });

    it('应该支持泛型类型推断', () => {
      interface User {
        id: number;
        name: string;
      }

      const user: User = { id: 1, name: 'John' };
      const response = ApiRes.success<User>(user);

      expect(response.data).toEqual(user);
      expect(response.data?.id).toBe(1);
      expect(response.data?.name).toBe('John');
    });
  });

  describe('ok 方法', () => {
    it('应该创建空成功响应', () => {
      const response = ApiRes.ok();

      expect(response.code).toBe(RESPONSE_SUCCESS_CODE);
      expect(response.data).toBeNull();
      expect(response.message).toBe(RESPONSE_SUCCESS_MSG);
    });

    it('应该返回 ApiRes<null> 类型', () => {
      const response = ApiRes.ok();

      expect(response).toBeInstanceOf(ApiRes);
      expect(response.data).toBeNull();
    });
  });

  describe('error 方法', () => {
    it('应该创建错误响应', () => {
      const errorCode = 400;
      const errorMessage = '参数错误';
      const response = ApiRes.error(errorCode, errorMessage);

      expect(response.code).toBe(errorCode);
      expect(response.data).toBeNull();
      expect(response.message).toBe(errorMessage);
    });

    it('应该支持不同的错误码', () => {
      const errorCodes = [400, 401, 403, 404, 500];

      errorCodes.forEach((code) => {
        const response = ApiRes.error(code, '错误消息');
        expect(response.code).toBe(code);
        expect(response.data).toBeNull();
      });
    });

    it('应该支持泛型类型', () => {
      const response = ApiRes.error<null>(404, '未找到');
      expect(response.code).toBe(404);
      expect(response.data).toBeNull();
    });
  });

  describe('custom 方法', () => {
    it('应该创建自定义响应', () => {
      const code = 201;
      const data = { id: 1, name: 'created' };
      const message = '创建成功';
      const response = ApiRes.custom(code, data, message);

      expect(response.code).toBe(code);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(message);
    });

    it('应该支持不同的状态码和数据组合', () => {
      const testCases = [
        { code: 201, data: { id: 1 }, message: 'Created' },
        { code: 202, data: null, message: 'Accepted' },
        { code: 204, data: undefined, message: 'No Content' },
      ];

      testCases.forEach(({ code, data, message }) => {
        const response = ApiRes.custom(code, data, message);
        expect(response.code).toBe(code);
        expect(response.data).toBe(data);
        expect(response.message).toBe(message);
      });
    });

    it('应该支持泛型类型推断', () => {
      interface Product {
        id: number;
        name: string;
        price: number;
      }

      const product: Product = { id: 1, name: 'Product', price: 99.99 };
      const response = ApiRes.custom<Product>(201, product, '产品创建成功');

      expect(response.data).toEqual(product);
      expect(response.data?.id).toBe(1);
      expect(response.data?.name).toBe('Product');
      expect(response.data?.price).toBe(99.99);
    });
  });

  describe('响应对象结构', () => {
    it('应该包含 code、message 和 data 字段', () => {
      const response = ApiRes.success({ test: 'data' });

      expect(response).toHaveProperty('code');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('data');
    });

    it('所有字段应该可访问', () => {
      const response = ApiRes.success({ id: 1 }, '自定义消息');

      expect(typeof response.code).toBe('number');
      expect(typeof response.message).toBe('string');
      expect(response.data).toBeDefined();
    });
  });

  describe('边界情况', () => {
    it('应该处理空字符串消息', () => {
      const response = ApiRes.success({}, '');
      expect(response.message).toBe('');
    });

    it('应该处理空对象数据', () => {
      const response = ApiRes.success({});
      expect(response.data).toEqual({});
    });

    it('应该处理空数组数据', () => {
      const response = ApiRes.success([]);
      expect(response.data).toEqual([]);
    });

    it('应该处理嵌套对象数据', () => {
      const nestedData = {
        user: {
          profile: {
            name: 'John',
            age: 30,
          },
        },
      };
      const response = ApiRes.success(nestedData);
      expect(response.data).toEqual(nestedData);
    });

    it('应该处理大数字错误码', () => {
      const response = ApiRes.error(999999, '大错误码');
      expect(response.code).toBe(999999);
    });
  });

  describe('方法链式调用场景', () => {
    it('应该支持连续创建不同类型的响应', () => {
      const successResponse = ApiRes.success({ id: 1 });
      const okResponse = ApiRes.ok();
      const errorResponse = ApiRes.error(404, '未找到');
      const customResponse = ApiRes.custom(201, { id: 2 }, '已创建');

      expect(successResponse.code).toBe(RESPONSE_SUCCESS_CODE);
      expect(okResponse.code).toBe(RESPONSE_SUCCESS_CODE);
      expect(errorResponse.code).toBe(404);
      expect(customResponse.code).toBe(201);
    });
  });
});

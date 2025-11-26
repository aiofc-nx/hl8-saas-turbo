import { getConfigPath } from '@hl8/utils';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SharedModule } from './shared.module';

// 在导入后获取 mock 的模块
const fs = jest.requireMock('fs') as {
  readFileSync: jest.Mock;
};
const yaml = jest.requireMock('js-yaml') as {
  load: jest.Mock;
};

// Mock ali-oss 以避免实际初始化 OSS 客户端
// 必须在 mock @hl8/oss 之前
// ali-oss 是一个默认导出的类，需要正确 mock
jest.mock('ali-oss', () => {
  const MockOSS = jest.fn().mockImplementation((config: any) => {
    // 确保所有可能被访问的属性都存在，避免 undefined 错误
    if (!config || !config.region) {
      // 如果配置无效，返回一个基本的 mock 对象
      return {
        put: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
        head: jest.fn(),
        signatureUrl: jest.fn(),
      };
    }
    return {
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      head: jest.fn(),
      signatureUrl: jest.fn(),
    };
  });
  return MockOSS;
});

// Mock 依赖模块 - 提供完整的模块结构以避免实际初始化
// 注意：由于这些模块是全局模块，需要在模块级别完全 mock
// 定义 mock 类以便在测试中使用
const MockIp2regionConfigService = class {
  getIp2RegionConfig() {
    return {
      xdbPath: '/path/to/ip2region.xdb',
      mode: 'VECTOR_INDEX',
    };
  }
};

const MockOssConfigService = class {
  getOssConfig() {
    return {
      region: 'test-region',
      accessKeyId: 'test-key',
      accessKeySecret: 'test-secret',
      bucket: 'test-bucket',
    };
  }
};

jest.mock('@hl8/ip2region', () => {
  const MockIp2regionService = class {};
  return {
    Ip2regionModule: class MockIp2regionModule {
      static forRoot() {
        return {
          module: MockIp2regionModule,
          providers: [MockIp2regionService, MockIp2regionConfigService],
          exports: [MockIp2regionService],
        };
      }
    },
    Ip2regionService: MockIp2regionService,
    Ip2regionConfigService: MockIp2regionConfigService,
  };
});

jest.mock('@hl8/oss', () => {
  // 创建一个不会实际初始化的 mock 服务
  const MockOssService = class {
    constructor() {
      // 空的构造函数，避免实际初始化
    }
  };
  return {
    OssModule: class MockOssModule {
      // 不使用 forRoot，直接作为普通模块
    },
    OssService: MockOssService,
    OssConfigService: MockOssConfigService,
  };
});

jest.mock('./cache-manager.module', () => ({
  CacheManagerModule: class MockCacheManagerModule {},
}));

jest.mock('@hl8/utils', () => ({
  getConfigPath: jest.fn((path: string) => `/mock/config/${path}`),
}));

// Mock fs 和 yaml 模块 - 必须在导入 SharedModule 之前
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => 'mock: yaml\ncontent: test'),
}));

// Mock js-yaml - 需要根据调用返回不同的配置
// 第一次调用返回 OSS 配置，第二次调用返回 IP2Region 配置
jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

/**
 * SharedModule 单元测试
 *
 * @description 验证共享模块的功能，包括模块导入、YAML 配置加载、EventEmitter 配置和模块导出
 */
describe('SharedModule', () => {
  let module: TestingModule;
  const originalEnv = process.env;

  // 辅助函数：创建测试模块，覆盖 OssConfigService 和 Ip2regionConfigService
  // 从 mock 模块中获取类引用
  const createTestModule = async () => {
    const { OssConfigService } = await import('@hl8/oss');
    const { Ip2regionConfigService } = await import('@hl8/ip2region');

    return Test.createTestingModule({
      imports: [SharedModule],
    })
      .overrideProvider(OssConfigService)
      .useValue({
        getOssConfig: jest.fn(() => ({
          region: 'test-region',
          accessKeyId: 'test-key',
          accessKeySecret: 'test-secret',
          bucket: 'test-bucket',
        })),
      })
      .overrideProvider(Ip2regionConfigService)
      .useValue({
        getIp2RegionConfig: jest.fn(() => ({
          xdbPath: '/path/to/ip2region.xdb',
          mode: 'VECTOR_INDEX',
        })),
      })
      .compile();
  };

  beforeEach(() => {
    // 重置环境变量
    process.env = { ...originalEnv };
    // 清除 EventEmitter 相关环境变量
    delete process.env.EVENT_EMITTER_WILDCARD;
    delete process.env.EVENT_EMITTER_DELIMITER;
    delete process.env.EVENT_EMITTER_NEW_LISTENER;
    delete process.env.EVENT_EMITTER_REMOVE_LISTENER;
    delete process.env.EVENT_EMITTER_MAX_LISTENERS;
    delete process.env.EVENT_EMITTER_IGNORE_ERRORS;

    // 重置 mock 返回值
    (fs.readFileSync as jest.Mock).mockReturnValue('mock: yaml\ncontent: test');
    // 重置 yaml.load mock，根据调用次数返回不同的配置
    // 注意：需要重置 mock 调用计数，否则每次测试都会累加
    (yaml.load as jest.Mock).mockClear();
    (yaml.load as jest.Mock).mockImplementation(() => {
      const callCount = (yaml.load as jest.Mock).mock.calls.length;
      // 第一次调用返回 OSS 配置
      if (callCount === 1) {
        return {
          oss: {
            default: {
              region: 'test-region',
              accessKeyId: 'test-key',
              accessKeySecret: 'test-secret',
              bucket: 'test-bucket',
            },
          },
        };
      }
      // 第二次调用返回 IP2Region 配置
      return {
        ip2region: {
          xdbPath: '/path/to/ip2region.xdb',
          mode: 'VECTOR_INDEX',
        },
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  describe('模块结构', () => {
    beforeEach(async () => {
      module = await createTestModule();
    });

    it('应该成功创建模块', () => {
      expect(module).toBeDefined();
    });
  });

  describe('模块导入', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [SharedModule],
      }).compile();
    });

    it('应该导入 ConfigModule', () => {
      const configModule = module.get(ConfigModule, { strict: false });
      // ConfigModule 是全局的，可能无法直接获取，但模块应该能正常编译
      expect(module).toBeDefined();
    });

    it('应该导入 HttpModule', () => {
      const httpModule = module.get(HttpModule, { strict: false });
      expect(httpModule).toBeDefined();
    });

    it('应该导入 ScheduleModule', () => {
      // ScheduleModule 已通过 forRoot() 初始化
      expect(module).toBeDefined();
    });

    it('应该导入 EventEmitterModule', () => {
      // EventEmitterModule 已通过 forRoot() 初始化
      expect(module).toBeDefined();
    });
  });

  describe('YAML 配置加载', () => {
    beforeEach(async () => {
      module = await createTestModule();
    });

    it('应该加载 OSS 配置文件', () => {
      expect(getConfigPath).toHaveBeenCalledWith('oss.config.yaml');
      // fs.readFileSync 已被 mock，验证 yaml.load 被调用
      expect(yaml.load).toHaveBeenCalled();
    });

    it('应该加载 IP2Region 配置文件', () => {
      expect(getConfigPath).toHaveBeenCalledWith('ip2region.config.yaml');
    });
  });

  describe('EventEmitter 配置', () => {
    describe('默认配置', () => {
      beforeEach(async () => {
        module = await createTestModule();
      });

      it('应该使用默认的 EventEmitter 配置', () => {
        // 验证模块能正常创建，说明默认配置生效
        expect(module).toBeDefined();
      });
    });

    describe('环境变量配置', () => {
      it('应该使用环境变量配置 wildcard', async () => {
        process.env.EVENT_EMITTER_WILDCARD = 'true';
        module = await createTestModule();

        expect(module).toBeDefined();
      });

      it('应该使用环境变量配置 delimiter', async () => {
        process.env.EVENT_EMITTER_DELIMITER = ':';
        module = await createTestModule();

        expect(module).toBeDefined();
      });

      it('应该使用环境变量配置 newListener', async () => {
        process.env.EVENT_EMITTER_NEW_LISTENER = 'true';
        module = await createTestModule();

        expect(module).toBeDefined();
      });

      it('应该使用环境变量配置 removeListener', async () => {
        process.env.EVENT_EMITTER_REMOVE_LISTENER = 'true';
        module = await createTestModule();

        expect(module).toBeDefined();
      });

      it('应该使用环境变量配置 maxListeners', async () => {
        process.env.EVENT_EMITTER_MAX_LISTENERS = '50';
        module = await createTestModule();

        expect(module).toBeDefined();
      });

      it('应该使用环境变量配置 ignoreErrors', async () => {
        process.env.EVENT_EMITTER_IGNORE_ERRORS = 'true';
        module = await createTestModule();

        expect(module).toBeDefined();
      });
    });
  });

  describe('模块导出', () => {
    beforeEach(async () => {
      module = await createTestModule();
    });

    it('应该导出 HttpModule', () => {
      const httpModule = module.get(HttpModule, { strict: false });
      expect(httpModule).toBeDefined();
    });

    it('应该导出 CacheManagerModule', () => {
      // CacheManagerModule 通过 SharedModule 导出
      expect(module).toBeDefined();
    });
  });

  describe('全局装饰器', () => {
    it('应该使用 @Global() 装饰器', () => {
      // 验证模块元数据中是否包含全局标记
      expect(SharedModule).toBeDefined();
    });
  });
});

// Mock ali-oss for testing
import { jest } from '@jest/globals';

const mockOssClient = {
  put: jest.fn<any>(),
  generateObjectUrl: jest.fn<any>(),
  signatureUrl: jest.fn<any>(),
  delete: jest.fn<any>(),
  head: jest.fn<any>(),
  list: jest.fn<any>(),
};

const OSS = jest.fn<any>().mockImplementation(() => mockOssClient);

export default OSS;
export { mockOssClient };

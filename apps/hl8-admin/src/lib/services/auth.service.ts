import {
  adaptLoginResponse,
  adaptRefreshTokenResponse,
} from '../adapters/auth.adapter'
import { apiClient } from '../api-client'
import type { ApiResponse } from '../api-client.types'
import { userService } from './user.service'

/**
 * 用户注册请求参数
 */
export interface RegisterRequest {
  /**
   * 用户邮箱地址
   */
  email: string
  /**
   * 用户密码
   */
  password: string
}

/**
 * 邮箱确认请求参数
 */
export interface ConfirmEmailRequest {
  /**
   * 用户邮箱地址
   */
  email: string
  /**
   * OTP 验证码（6 位数字）
   */
  token: string
}

/**
 * 用户登录请求参数
 */
export interface SignInRequest {
  /**
   * 用户标识符（邮箱或用户名）
   */
  identifier: string
  /**
   * 用户密码
   */
  password: string
}

/**
 * 刷新令牌请求参数
 */
export interface RefreshTokenRequest {
  /**
   * 刷新令牌字符串
   */
  refreshToken: string
}

/**
 * 用户登出请求参数
 */
export interface SignOutRequest {
  /**
   * 刷新令牌
   *
   * @description 用于标识要退出的会话的刷新令牌
   */
  refreshToken: string
}

/**
 * 登录响应数据
 */
export interface SignInResponseData {
  /**
   * 用户 ID
   */
  id: string
  /**
   * 用户邮箱
   */
  email: string
  /**
   * 用户名
   */
  username: string
  /**
   * 用户昵称
   */
  nickName?: string
  /**
   * 用户头像 URL
   */
  avatar?: string | null
  /**
   * 邮箱是否已验证
   */
  isEmailVerified: boolean
  /**
   * 邮箱验证时间
   */
  emailVerifiedAt?: string
  /**
   * 创建时间
   */
  createdAt: string
  /**
   * 更新时间
   */
  updatedAt: string
  /**
   * 个人资料（如果存在）
   */
  profile?: unknown
}

/**
 * 登录响应（包含令牌）
 */
export interface SignInResponse {
  /**
   * 响应消息
   */
  message: string
  /**
   * 用户数据
   */
  data: SignInResponseData
  /**
   * 认证令牌
   */
  tokens: {
    /**
     * 访问令牌
     */
    access_token: string
    /**
     * 刷新令牌
     */
    refresh_token: string
    /**
     * 会话令牌
     */
    session_token: string
    /**
     * 访问令牌刷新时间
     */
    session_refresh_time: string
  }
}

/**
 * 刷新令牌响应
 */
export interface RefreshTokenResponse {
  /**
   * 响应消息
   */
  message: string
  /**
   * 访问令牌
   */
  access_token: string
  /**
   * 刷新令牌
   */
  refresh_token: string
  /**
   * 访问令牌刷新时间
   */
  access_token_refresh_time: string
  /**
   * 会话令牌
   */
  session_token: string
}

/**
 * 认证服务
 * 提供用户注册、登录、邮箱确认、令牌刷新、登出等认证相关的 API 调用
 */
export const authService = {
  /**
   * 用户注册
   * 创建新用户账户，后端会发送验证码到注册邮箱
   *
   * @param data - 注册数据（邮箱和密码）
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await authService.register({
   *   email: 'user@example.com',
   *   password: 'password123'
   * })
   * ```
   */
  async register(data: RegisterRequest): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(
      '/auth/register',
      {
        email: data.email,
        password: data.password,
        // 可选字段：如果前端需要传递用户名和昵称，可以在这里添加
        // username: data.username,
        // nickName: data.nickName,
      },
      {
        skipDataExtraction: true,
      }
    )
    return response.data as ApiResponse
  },

  /**
   * 确认邮箱（OTP 验证）
   * 使用 OTP 验证码确认用户邮箱，验证成功后自动登录并返回令牌
   *
   * @param data - 邮箱确认数据（邮箱和验证码）
   * @returns Promise，解析为登录响应（包含用户数据和令牌）
   *
   * @example
   * ```ts
   * const response = await authService.confirmEmail({
   *   email: 'user@example.com',
   *   token: '123456'
   * })
   * ```
   */
  async confirmEmail(data: ConfirmEmailRequest): Promise<SignInResponse> {
    const response = await apiClient.patch<{ data: SignInResponse }>(
      '/auth/confirm-email',
      data,
      {
        skipDataExtraction: true,
      }
    )
    // 后端返回格式：{ code, message, data: { message, data, tokens } }
    // 需要提取 response.data.data
    return response.data.data as SignInResponse
  },

  /**
   * 用户登录
   * 验证用户凭据，生成访问令牌和刷新令牌
   *
   * @param data - 登录数据（标识符和密码）
   * @returns Promise，解析为登录响应（包含用户数据和令牌）
   *
   * @remarks
   * identifier 可以是邮箱或用户名
   * 设备信息会自动通过请求拦截器添加
   *
   * @example
   * ```ts
   * const response = await authService.signIn({
   *   identifier: 'user@example.com',
   *   password: 'password123'
   * })
   * ```
   */
  async signIn(data: SignInRequest): Promise<SignInResponse> {
    const response = await apiClient.post<{
      code: number
      message: string
      data: { token: string; refreshToken: string }
    }>('/auth/login', data, {
      skipDataExtraction: true,
    })

    // 后端返回格式：{ code, message, data: { token, refreshToken } }
    // 适配器期望格式：{ message, data: { token, refreshToken } }
    const backendResponse = {
      message: response.data.message,
      data: response.data.data,
    }

    // 使用适配器转换响应格式
    const adaptedResponse = adaptLoginResponse(backendResponse)

    // 临时设置 token 以便后续调用 getUserInfo
    // 注意：这里只是临时设置，最终应该由调用方（登录表单）设置
    const { useAuthStore } = await import('@/stores/auth-store')
    useAuthStore
      .getState()
      .auth.setAccessToken(adaptedResponse.tokens.access_token)
    useAuthStore
      .getState()
      .auth.setRefreshToken(adaptedResponse.tokens.refresh_token)
    useAuthStore
      .getState()
      .auth.setSessionToken(adaptedResponse.tokens.session_token)

    // 登录成功后，尝试获取完整的用户信息
    try {
      const userInfoResponse = await userService.getUserInfo()

      // 更新用户信息
      if (userInfoResponse.data) {
        adaptedResponse.data.id = userInfoResponse.data.userId
        adaptedResponse.data.username = userInfoResponse.data.userName
        adaptedResponse.data.nickName = userInfoResponse.data.nickName
        adaptedResponse.data.avatar = userInfoResponse.data.avatar
        // 注意：getUserInfo 不返回 email，email 需要从其他接口获取或保持为空
      }
    } catch {
      // 如果获取用户信息失败，使用从 token 解析的信息
      // 这是可选的，不影响登录流程
    }

    return adaptedResponse
  },

  /**
   * 刷新访问令牌
   * 使用刷新令牌生成新的访问令牌和刷新令牌对
   *
   * @param data - 刷新令牌数据（刷新令牌字符串）
   * @returns Promise，解析为刷新令牌响应
   *
   * @example
   * ```ts
   * const response = await authService.refreshToken({
   *   refreshToken: 'refresh-token-string'
   * })
   * ```
   */
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<{
      message: string
      data: { token: string; refreshToken: string }
    }>(
      '/auth/refreshToken',
      { refreshToken: data.refreshToken },
      {
        skipDataExtraction: true,
      }
    )

    // 使用适配器转换响应格式
    return adaptRefreshTokenResponse(response.data)
  },

  /**
   * 用户登出
   * 删除当前设备的会话记录
   *
   * @param data - 登出数据（会话令牌）
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await authService.signOut({
   *   session_token: 'session-token'
   * })
   * ```
   */
  async signOut(data: SignOutRequest): Promise<ApiResponse> {
    const response = await apiClient.post<{
      code: number
      message: string
      data: { message: string }
    }>(
      '/auth/sign-out',
      { refreshToken: data.refreshToken },
      {
        skipDataExtraction: true,
      }
    )
    // 后端返回格式：{ code, message, data: { message } }
    return {
      message: response.data.data.message,
      data: response.data.data,
    } as ApiResponse
  },

  /**
   * 重发确认邮件
   * 为未验证邮箱的用户重新发送确认邮件
   *
   * @param email - 用户邮箱地址
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await authService.resendConfirmationEmail('user@example.com')
   * ```
   */
  async resendConfirmationEmail(email: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(
      '/auth/resend-confirmation-email',
      { email },
      {
        skipDataExtraction: true,
      }
    )
    return response.data as ApiResponse
  },
}

/**
 * 前端期望的登录响应格式
 */
import type {
  SignInResponse,
  SignInResponseData,
  RefreshTokenResponse,
} from '../services/auth.service'

/**
 * 认证响应适配器
 * 将后端返回的认证响应格式转换为前端期望的格式
 */

/**
 * 后端登录响应格式
 */
interface BackendLoginResponse {
  message: string
  data: {
    token: string
    refreshToken: string
  }
}

/**
 * 后端刷新令牌响应格式
 */
interface BackendRefreshTokenResponse {
  message: string
  data: {
    token: string
    refreshToken: string
  }
}

/**
 * 从 JWT token 中解析用户信息
 *
 * @param token - JWT token 字符串
 * @returns 解析后的用户信息，如果解析失败返回 null
 */
function parseJwtToken(
  token: string
): { uid?: string; username?: string; domain?: string } | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    )

    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * 适配后端登录响应为前端期望的格式
 *
 * @param backendResponse - 后端返回的登录响应
 * @returns 适配后的前端登录响应
 */
export function adaptLoginResponse(
  backendResponse: BackendLoginResponse
): SignInResponse {
  // 从 token 中解析用户信息
  const tokenPayload = parseJwtToken(backendResponse.data.token) || {}

  // 构建用户数据（从 token 中提取，如果后端有 getUserInfo 接口，可以后续调用补充）
  const userData: SignInResponseData = {
    id: tokenPayload.uid || '',
    email: '', // JWT token 中不包含 email，需要通过 getUserInfo 获取
    username: tokenPayload.username || '',
    isEmailVerified: false, // 需要从后端获取
    createdAt: new Date().toISOString(), // 需要从后端获取
    updatedAt: new Date().toISOString(), // 需要从后端获取
  }

  // 适配令牌格式
  // 注意：后端没有返回 session_token，这里使用 refreshToken 作为临时方案
  // 实际应该从后端获取或从 token 中解析
  return {
    message: backendResponse.message,
    data: userData,
    tokens: {
      access_token: backendResponse.data.token,
      refresh_token: backendResponse.data.refreshToken,
      session_token: backendResponse.data.refreshToken, // 临时使用 refreshToken，需要后端返回
      session_refresh_time: new Date().toISOString(), // 需要从后端获取
    },
  }
}

/**
 * 适配后端刷新令牌响应为前端期望的格式
 *
 * @param backendResponse - 后端返回的刷新令牌响应
 * @returns 适配后的前端刷新令牌响应
 */
export function adaptRefreshTokenResponse(
  backendResponse: BackendRefreshTokenResponse
): RefreshTokenResponse {
  return {
    message: backendResponse.message,
    access_token: backendResponse.data.token,
    refresh_token: backendResponse.data.refreshToken,
    access_token_refresh_time: new Date().toISOString(), // 需要从后端获取
    session_token: backendResponse.data.refreshToken, // 临时使用 refreshToken，需要后端返回
  }
}

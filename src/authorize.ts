import { RoleManager } from './roleManager.js'
import { parseToken } from './utils/token.js'

export interface UserContext {
  id?: string
  role: string
  attributes?: Record<string, any>
}

export interface AuditLogger {
  allow?: (user: UserContext, path: string) => void
  deny?: (user: UserContext | null, path: string) => void
}

export interface AuthAdapter {
  parse(req: any): Promise<UserContext | null> | UserContext | null
}

export class JwtAuthAdapter implements AuthAdapter {
  constructor(private secret: string) {}
  async parse(req: any): Promise<UserContext | null> {
    const header = req?.headers?.authorization || req?.headers?.Authorization
    if (!header) return null
    try {
      const decoded: any = parseToken(header, this.secret)
      return {
        id: decoded.sub ?? decoded.id,
        role: decoded.role,
        attributes: decoded,
      }
    } catch {
      return null
    }
  }
}

export class SessionAuthAdapter implements AuthAdapter {
  async parse(req: any): Promise<UserContext | null> {
    const user = req?.session?.user
    if (!user) return null
    return { id: user.id, role: user.role, attributes: user }
  }
}

export class CustomHeaderAuthAdapter implements AuthAdapter {
  async parse(req: any): Promise<UserContext | null> {
    const role = req?.headers?.['x-role'] || req?.headers?.['X-Role']
    if (!role) return null
    return { id: 'guest', role: String(role) }
  }
}

type FilterFn = (user: UserContext, req: any) => boolean | Promise<boolean>

type CreateAuthorizeOptions =
  | { roleManager: RoleManager; secret: string; authAdapter?: undefined; filter?: FilterFn; logger?: AuditLogger }
  | { roleManager: RoleManager; authAdapter: AuthAdapter; secret?: undefined; filter?: FilterFn; logger?: AuditLogger }

function respond(res: any, status: number, body: any) {
  if (typeof res?.status === 'function' && typeof res?.json === 'function') return res.status(status).json(body)
  if (typeof res?.code === 'function' && typeof res?.send === 'function') return res.code(status).send(body)
  if (typeof res?.status === 'function' && typeof res?.send === 'function') return res.status(status).send(body)
  try {
    res.statusCode = status
  } catch {}
  if (typeof res?.end === 'function') return res.end(JSON.stringify(body))
}

function pickPath(req: any): string | undefined {
  try {
    const candidate = [
      (req?.baseUrl || '') + (req?.route?.path || ''),
      req?.path,
      req?.url,
      req?.originalUrl,
    ].filter(Boolean) as string[]
    return candidate[0]
  } catch {
    return undefined
  }
}

export function createAuthorize(options: CreateAuthorizeOptions) {
  const { roleManager } = options as any
  const adapter: AuthAdapter = 'authAdapter' in options && options.authAdapter
    ? options.authAdapter
    : new JwtAuthAdapter((options as any).secret)
  const filter: FilterFn | undefined = (options as any).filter
  const logger: AuditLogger | undefined = (options as any).logger

  return async (req: any, res: any, next: Function) => {
    const user = await Promise.resolve(adapter.parse(req))
    if (!user) {
      logger?.deny?.(null, pickPath(req) || '')
      return respond(res, 401, { message: 'Unauthorized' })
    }

    ;(req as any).user = user

    const path = pickPath(req) || ''
    const allowedRoles = roleManager.getRolesForPath(path)
    if (!allowedRoles || allowedRoles.length === 0) {
      logger?.allow?.(user, path)
      return next()
    }

    const resolved = roleManager.resolve(user.role)
    const hasRole = allowedRoles.some((r: string) => resolved.includes(r))
    if (!hasRole) {
      logger?.deny?.(user, path)
      return respond(res, 403, { message: 'Forbidden' })
    }

    if (filter) {
      const ok = await Promise.resolve(filter(user, req))
      if (!ok) {
        logger?.deny?.(user, path)
        return respond(res, 403, { message: 'Forbidden by attribute filter' })
      }
    }

    logger?.allow?.(user, path)
    return next()
  }
}

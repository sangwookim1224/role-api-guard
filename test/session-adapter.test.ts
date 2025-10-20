import { describe, it, expect } from 'vitest'
import { RoleManager, createAuthorize, SessionAuthAdapter } from '../dist/esm/index.js'

function mockRes() {
  const out: any = { statusCode: 200, body: undefined as any }
  out.status = (code: number) => { out.statusCode = code; return out }
  out.code = (code: number) => { out.statusCode = code; return out }
  out.json = (b: any) => { out.body = b; return out }
  out.send = (b: any) => { out.body = b; return out }
  out.end = (b: any) => { out.body = b; return out }
  return out
}

describe('SessionAuthAdapter', () => {
  const permissions = {
    '/api/users': ['admin'],
  }
  const roleMap = {
    admin: { inherits: ['user'] },
    user: { inherits: ['guest'] },
    guest: {},
  }

  it('returns 401 when session missing', async () => {
    const roles = new RoleManager(permissions)
    roles.loadRoles(roleMap)
    const authorize = createAuthorize({ roleManager: roles, authAdapter: new SessionAuthAdapter() })

    const req: any = { baseUrl: '/api', route: { path: '/users' } }
    const res = mockRes()
    const next = () => {}

    await authorize(req, res, next)
    expect(res.statusCode).toBe(401)
  })

  it('allows when session user has required role', async () => {
    const roles = new RoleManager(permissions)
    roles.loadRoles(roleMap)
    const authorize = createAuthorize({ roleManager: roles, authAdapter: new SessionAuthAdapter() })

    const req: any = { baseUrl: '/api', route: { path: '/users' }, session: { user: { id: '1', role: 'admin' } } }
    const res = mockRes()
    let nextCalled = false
    const next = () => { nextCalled = true }

    await authorize(req, res, next)
    expect(nextCalled).toBe(true)
    expect(res.statusCode).toBe(200)
  })

  it('denies with 403 when session role mismatches', async () => {
    const roles = new RoleManager(permissions)
    roles.loadRoles(roleMap)
    const authorize = createAuthorize({ roleManager: roles, authAdapter: new SessionAuthAdapter() })

    const req: any = { baseUrl: '/api', route: { path: '/users' }, session: { user: { id: '1', role: 'guest' } } }
    const res = mockRes()
    const next = () => {}

    await authorize(req, res, next)
    expect(res.statusCode).toBe(403)
  })
})


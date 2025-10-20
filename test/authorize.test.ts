import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { RoleManager, createAuthorize, JwtAuthAdapter } from '../dist/esm/index.js'

function mockRes() {
  const out: any = { statusCode: 200, body: undefined as any }
  out.status = (code: number) => { out.statusCode = code; return out }
  out.code = (code: number) => { out.statusCode = code; return out }
  out.json = (b: any) => { out.body = b; return out }
  out.send = (b: any) => { out.body = b; return out }
  out.end = (b: any) => { out.body = b; return out }
  return out
}

describe('authorize middleware', () => {
  const secret = 'testsecret'
  const permissions = {
    '/api/users': ['admin'],
    '/api/profile': ['user'],
  }
  const roleMap = {
    admin: { inherits: ['user'] },
    user: { inherits: ['guest'] },
    guest: {},
  }

  it('allows request when role matches', async () => {
    const roles = new RoleManager(permissions)
    roles.loadRoles(roleMap)
    const authorize = createAuthorize({ roleManager: roles, authAdapter: new JwtAuthAdapter(secret) })

    const token = jwt.sign({ sub: '1', role: 'admin' }, secret)
    const req: any = { headers: { authorization: `Bearer ${token}` }, baseUrl: '/api', route: { path: '/users' } }
    const res = mockRes()
    let nextCalled = false
    const next = () => { nextCalled = true }

    await authorize(req, res, next)
    expect(nextCalled).toBe(true)
    expect(res.statusCode).toBe(200)
  })

  it('denies with 403 when role mismatches', async () => {
    const roles = new RoleManager(permissions)
    roles.loadRoles(roleMap)
    const authorize = createAuthorize({ roleManager: roles, authAdapter: new JwtAuthAdapter(secret) })

    const token = jwt.sign({ sub: '1', role: 'guest' }, secret)
    const req: any = { headers: { authorization: `Bearer ${token}` }, baseUrl: '/api', route: { path: '/users' } }
    const res = mockRes()
    const next = () => {}

    await authorize(req, res, next)
    expect(res.statusCode).toBe(403)
  })

  it('returns 401 when no token provided', async () => {
    const roles = new RoleManager(permissions)
    roles.loadRoles(roleMap)
    const authorize = createAuthorize({ roleManager: roles, authAdapter: new JwtAuthAdapter(secret) })

    const req: any = { headers: {}, baseUrl: '/api', route: { path: '/users' } }
    const res = mockRes()
    const next = () => {}

    await authorize(req, res, next)
    expect(res.statusCode).toBe(401)
  })

  it('allows when path has no configured roles', async () => {
    const roles = new RoleManager({})
    roles.loadRoles(roleMap)
    const authorize = createAuthorize({ roleManager: roles, authAdapter: new JwtAuthAdapter(secret) })

    const token = jwt.sign({ sub: '1', role: 'guest' }, secret)
    const req: any = { headers: { authorization: `Bearer ${token}` }, baseUrl: '/public', route: { path: '/ping' } }
    const res = mockRes()
    let nextCalled = false
    const next = () => { nextCalled = true }

    await authorize(req, res, next)
    expect(nextCalled).toBe(true)
    expect(res.statusCode).toBe(200)
  })
})

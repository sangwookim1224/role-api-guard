import { describe, it, expect } from 'vitest'
import { RoleManager } from '../dist/esm/index.js'

describe('RoleManager', () => {
  it('returns exact path roles first', () => {
    const rm = new RoleManager({
      '/api/users': ['admin'],
      '/api': ['user'],
    })
    expect(rm.getRolesForPath('/api/users')).toEqual(['admin'])
  })

  it('falls back to longest prefix', () => {
    const rm = new RoleManager({
      '/api': ['user'],
    })
    expect(rm.getRolesForPath('/api/profile')).toEqual(['user'])
  })

  it('resolves role hierarchy including self', () => {
    const rm = new RoleManager()
    rm.loadRoles({
      admin: { inherits: ['user'] },
      user: { inherits: ['guest'] },
      guest: {},
    })
    const resolved = rm.resolve('admin')
    expect(resolved).toContain('admin')
    expect(resolved).toContain('user')
    expect(resolved).toContain('guest')
  })
})

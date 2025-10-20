import express from 'express'
import { RoleManager, createAuthorize, JwtAuthAdapter } from '../dist/esm/index.js'

// Endpoint permissions and role hierarchy
const permissions = {
  '/api/users': ['super_admin', 'admin'],
  '/api/profile': ['user', 'manager', 'admin'],
}

const roleMap = {
  super_admin: { inherits: ['admin'] },
  admin: { inherits: ['manager'] },
  manager: { inherits: ['user'] },
  user: { inherits: ['guest'] },
  guest: {},
}

const roles = new RoleManager(permissions)
roles.loadRoles(roleMap)

const authorize = createAuthorize({
  roleManager: roles,
  authAdapter: new JwtAuthAdapter(process.env.JWT_SECRET || 'devsecret'),
})

const app = express()
app.get('/api/users', authorize, (_req, res) => res.json({ msg: '관리자 접근' }))
app.get('/api/profile', authorize, (_req, res) => res.json({ msg: '유저 접근' }))

if (process.env.RUN_SERVER === '1') {
  app.listen(3000, () => console.log('Express example listening on 3000'))
}

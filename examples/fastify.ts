import Fastify from 'fastify'
import { RoleManager, createAuthorize, JwtAuthAdapter } from '../dist/esm/index.js'

const permissions = {
  '/users': ['admin'],
  '/profile': ['user', 'admin'],
}

const roleMap = {
  admin: { inherits: ['user'] },
  user: { inherits: ['guest'] },
  guest: {},
}

const roles = new RoleManager(permissions)
roles.loadRoles(roleMap)

const authorize = createAuthorize({
  roleManager: roles,
  authAdapter: new JwtAuthAdapter(process.env.JWT_SECRET || 'devsecret'),
})

const app = Fastify()
app.addHook('preHandler', authorize)
app.get('/profile', async (_req, res) => res.send({ msg: 'ok' }))

if (process.env.RUN_SERVER === '1') {
  app.listen({ port: 3000 }, () => console.log('Fastify example listening on 3000'))
}

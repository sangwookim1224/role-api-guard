RoleGuard — Lightweight Role-Based Access Control Middleware for Node.js

Overview
- Minimal middleware to guard API routes based on user role.
- Works with Express and Fastify.
- TypeScript-first with JS compatibility.
- JWT by default; pluggable auth via adapters (JWT/Session/Custom).

Install
- npm install role-api-guard jsonwebtoken

Dual Import (ESM & CJS)
- ESM (TypeScript/ESM):
  import { RoleManager, createAuthorize, JwtAuthAdapter } from 'role-api-guard'
- CommonJS:
  const { RoleManager, createAuthorize, JwtAuthAdapter } = require('role-api-guard')

Quick Start (TypeScript, Express + JWT)
1) Define path permissions and role hierarchy
   const roles = new RoleManager({
     '/api/users': ['super_admin', 'admin'],
     '/api/profile': ['user', 'manager', 'admin']
   })
   roles.loadRoles({
     super_admin: { inherits: ['admin'] },
     admin: { inherits: ['manager'] },
     manager: { inherits: ['user'] },
     user: { inherits: ['guest'] },
     guest: {},
   })
2) Create middleware
   const authorize = createAuthorize({
     roleManager: roles,
     authAdapter: new JwtAuthAdapter(process.env.JWT_SECRET!)
   })
3) Use with Express
   app.get('/api/users', authorize, (_, res) => res.json({ msg: 'ok' }))
   app.listen(3000)

Custom Role Hierarchy + Adapter (TypeScript)
  const roleMap = { admin: { inherits: ['user'] }, user: {} }
  const roles = new RoleManager(roleMap)
  const authorize = createAuthorize({ roleManager: roles, authAdapter: new JwtAuthAdapter('secret') })

API
- RoleManager
  - new RoleManager(initial?)
    - initial can be endpoint permissions (path -> roles[]) or role hierarchy map (name -> { inherits })
  - load(map: Record<string, string[]>) -> void
  - loadRoles(map: Record<string, { inherits?: string[] }>) -> void
  - getRolesForPath(path: string) -> string[]
  - resolve(roleName: string) -> string[]
  - register(name: string, inherits?: string[]) -> void
  - has(name: string) -> boolean
- createAuthorize(options)
  - options: { roleManager, secret? | authAdapter?, filter?, logger? }
  - Returns Express/Fastify-compatible middleware
  - Sets req.user = { id?, role, attributes? }

Auth Adapters
- JwtAuthAdapter(secret)
  - Reads `Authorization: Bearer <token>` header and verifies with secret
  - Decoded fields populate `req.user`
- SessionAuthAdapter()
  - Reads `req.session.user` with shape `{ id, role, ... }`
  - Useful for server-managed session stores

Notes (TS-first)
- Source is implemented in TypeScript (src/), types are published (dist/*.d.ts).
- If a path is not configured, access is allowed by default.
- Exact path match preferred; otherwise longest prefix match.
- For Fastify, the same middleware is usable via preHandler.

Examples (TypeScript)
- examples/express.ts
- examples/fastify.ts

Run Examples
- Express: `npm run example:express` (set `RUN_SERVER=1` to actually listen)
- Fastify: `npm run example:fastify` (set `RUN_SERVER=1` to actually listen)

License
- MIT

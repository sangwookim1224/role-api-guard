import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'

describe('CJS require compatibility', () => {
  it('can require CommonJS build', async () => {
    const require = createRequire(import.meta.url)
    const lib = require('../dist/cjs/index.js')
    expect(typeof lib.RoleManager).toBe('function')
    expect(typeof lib.createAuthorize).toBe('function')
  })
})


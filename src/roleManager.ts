export type RoleDef = { inherits?: string[] }

export class RoleManager {
  private permissions: Map<string, string[]> = new Map()
  private roles: Map<string, RoleDef> = new Map()

  constructor(initial?: Record<string, any>) {
    if (initial && Object.keys(initial).length > 0) {
      const firstVal = initial[Object.keys(initial)[0]]
      if (Array.isArray(firstVal)) {
        this.load(initial as Record<string, string[]>)
      } else {
        this.loadRoles(initial as Record<string, RoleDef>)
      }
    }
  }

  // Endpoint permissions (path -> roles[])
  load(map: Record<string, string[]>) {
    this.permissions = new Map(Object.entries(map))
  }

  // Role hierarchy map (name -> { inherits })
  loadRoles(map: Record<string, RoleDef>) {
    this.roles = new Map(Object.entries(map))
  }

  register(name: string, inherits?: string[]) {
    this.roles.set(name, { inherits })
  }

  has(name: string): boolean {
    return this.roles.has(name)
  }

  getRolesForPath(path: string): string[] {
    if (!path) return []
    // Exact match first
    if (this.permissions.has(path)) return this.permissions.get(path) || []
    // Longest prefix match
    let bestKey: string | undefined
    for (const key of this.permissions.keys()) {
      if (path.startsWith(key)) {
        if (!bestKey || key.length > bestKey.length) bestKey = key
      }
    }
    return bestKey ? this.permissions.get(bestKey) || [] : []
  }

  // Resolve role with hierarchy (DFS), including self
  resolve(roleName: string): string[] {
    const visited = new Set<string>()
    const result: string[] = []

    const dfs = (name: string) => {
      if (visited.has(name)) return
      visited.add(name)
      result.push(name)
      const def = this.roles.get(name)
      if (def?.inherits) {
        for (const parent of def.inherits) dfs(parent)
      }
    }

    // If no role map configured, just return the given role
    if (!this.roles.size) return [roleName]
    dfs(roleName)
    return result
  }
}


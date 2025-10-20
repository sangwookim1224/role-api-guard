import jwt from 'jsonwebtoken'

export function parseToken(authHeader: string | undefined, secret: string): any {
  if (!authHeader) throw new Error('No Authorization header')
  const parts = authHeader.split(' ')
  const token = parts.length === 2 ? parts[1] : parts[0]
  try {
    return jwt.verify(token, secret)
  } catch {
    throw new Error('Invalid token')
  }
}


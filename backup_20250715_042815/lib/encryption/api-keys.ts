import forge from 'node-forge'
import { prisma } from '@/lib/database'

interface EncryptedApiKey {
  id: string
  userId: string
  name: string
  encryptedKey: string
  iv: string
  permissions: string[]
  expiresAt?: Date
  createdAt: Date
}

export class ApiKeyManager {
  private static ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY!

  static encrypt(plaintext: string): { encrypted: string; iv: string } {
    const key = forge.util.createBuffer(this.ENCRYPTION_KEY)
    const iv = forge.random.getBytesSync(16)
    const cipher = forge.cipher.createCipher('AES-CBC', key)
    
    cipher.start({ iv })
    cipher.update(forge.util.createBuffer(plaintext))
    cipher.finish()
    
    return {
      encrypted: forge.util.encode64(cipher.output.getBytes()),
      iv: forge.util.encode64(iv)
    }
  }

  static decrypt(encrypted: string, iv: string): string {
    const key = forge.util.createBuffer(this.ENCRYPTION_KEY)
    const decipher = forge.cipher.createDecipher('AES-CBC', key)
    
    decipher.start({ iv: forge.util.createBuffer(forge.util.decode64(iv)) })
    decipher.update(forge.util.createBuffer(forge.util.decode64(encrypted)))
    decipher.finish()
    
    return decipher.output.toString()
  }

  static async createApiKey(userId: string, name: string, permissions: string[]): Promise<string> {
    const apiKey = `gst_${forge.random.getBytesSync(32).toString('hex')}`
    const { encrypted, iv } = this.encrypt(apiKey)
    
    await prisma.apiKey.create({
      data: {
        userId,
        name,
        encryptedKey: encrypted,
        iv,
        permissions,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    })
    
    return apiKey
  }

  static async validateApiKey(apiKey: string): Promise<{ userId: string; permissions: string[] } | null> {
    const keyRecord = await prisma.apiKey.findFirst({
      where: {
        expiresAt: { gt: new Date() },
        isActive: true
      }
    })
    
    if (!keyRecord) return null
    
    try {
      const decryptedKey = this.decrypt(keyRecord.encryptedKey, keyRecord.iv)
      if (decryptedKey === apiKey) {
        return {
          userId: keyRecord.userId,
          permissions: keyRecord.permissions
        }
      }
    } catch (error) {
      console.error('API key decryption failed:', error)
    }
    
    return null
  }
}

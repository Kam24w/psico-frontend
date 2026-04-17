/**
 * Cloudflare-style Email Address Obfuscation logic.
 * This implements a simple XOR-based encoding/decoding scheme.
 */

/**
 * Encodes a string into a hex string where the first two characters 
 * are the XOR key.
 */
export function cfObfuscate(text: string): string {
  const hexKey = Math.floor(Math.random() * 256)
  let encoded = hexKey.toString(16).padStart(2, '0')

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ hexKey
    encoded += charCode.toString(16).padStart(2, '0')
  }

  return encoded
}

/**
 * Decodes a hex string that was obfuscated using the CF method.
 */
export function cfDeobfuscate(hex: string): string {
  if (hex.length < 2) return ''
  
  const r = parseInt(hex.substring(0, 2), 16)
  let decoded = ''

  for (let i = 2; i < hex.length; i += 2) {
    const charCode = parseInt(hex.substring(i, i + 2), 16) ^ r
    decoded += String.fromCharCode(charCode)
  }

  return decoded
}

/**
 * Compact 1-to-1 Obfuscation.
 * Maps 1 character to 1 Unicode Private Use character.
 * Preserves length (1 dot = 1 char) but hides text from DOM.
 */
const COMPACT_KEY = 42
const UNICODE_OFFSET = 0xE000

export function cfObfuscateCompact(text: string): string {
  return text.split('').map(c => 
    String.fromCharCode(UNICODE_OFFSET + (c.charCodeAt(0) ^ COMPACT_KEY))
  ).join('')
}

export function cfDeobfuscateCompact(encoded: string): string {
  return encoded.split('').map(c => 
    String.fromCharCode((c.charCodeAt(0) - UNICODE_OFFSET) ^ COMPACT_KEY)
  ).join('')
}

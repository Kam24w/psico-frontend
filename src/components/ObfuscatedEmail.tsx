import React, { useMemo } from 'react'
import { cfObfuscate, cfDeobfuscate } from '../services/security'

interface ObfuscatedEmailProps {
  email: string
  className?: string
}

/**
 * A component that displays an email address safely by obfuscating it 
 * in the underlying HTML but rendering it correctly for humans.
 */
const ObfuscatedEmail: React.FC<ObfuscatedEmailProps> = ({ email, className }) => {
  // We obfuscate the email once and store it in a data attribute
  const obfuscated = useMemo(() => cfObfuscate(email), [email])
  
  // Decoded version for display
  const decoded = useMemo(() => cfDeobfuscate(obfuscated), [obfuscated])

  return (
    <a 
      href={`mailto:${decoded}`}
      className={className}
      data-cfemail={obfuscated}
    >
      {decoded}
    </a>
  )
}

export default ObfuscatedEmail

// Muestra la emoción detectada en tiempo real

const EMOCIONES = {
  FELIZ:       { emoji: '😊', label: 'Feliz',       color: '#FFD700' },
  TRISTE:      { emoji: '😢', label: 'Triste',      color: '#6CA0DC' },
  ESTRESADO:   { emoji: '😰', label: 'Estresado',   color: '#FF6B6B' },
  ENOJADO:     { emoji: '😠', label: 'Enojado',     color: '#FF4444' },
  ANSIOSO:     { emoji: '😟', label: 'Ansioso',     color: '#FF8C00' },
  SORPRENDIDO: { emoji: '😲', label: 'Sorprendido', color: '#9B59B6' },
  NEUTRAL:     { emoji: '😐', label: 'Neutral',     color: '#A8D5A2' },
}

export default function EmotionBadge({ emocion }) {
  const info = EMOCIONES[emocion?.tipo] || EMOCIONES.NEUTRAL

  return (
    <div style={{ ...styles.badge, borderColor: info.color }}>
      <span style={styles.emoji}>{info.emoji}</span>
      <div>
        <div style={styles.label}>Emoción detectada</div>
        <div style={{ ...styles.tipo, color: info.color }}>{info.label}</div>
      </div>
      {emocion?.intensidad > 0 && (
        <div style={styles.intensidad}>
          {Math.round(emocion.intensidad * 100)}%
        </div>
      )}
    </div>
  )
}

const styles = {
  badge: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#fff', border: '2px solid',
    borderRadius: 14, padding: '8px 14px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  emoji:      { fontSize: 28 },
  label:      { fontSize: 11, color: '#aaa', fontWeight: 500 },
  tipo:       { fontSize: 15, fontWeight: 700 },
  intensidad: { fontSize: 12, color: '#bbb', marginLeft: 4 },
}

interface Props {
  title: string
}

export default function SectionHeader({ title }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 0' }}>
      <div style={{ flex: 1, height: 2, background: '#CC3300' }} />
      <span
        style={{
          fontFamily: '"Press Start 2P", "Courier New", monospace',
          fontSize: 11,
          color: '#FF6600',
          whiteSpace: 'nowrap',
          letterSpacing: '0.08em',
        }}
      >
        {title}
      </span>
      <div style={{ flex: 1, height: 2, background: '#CC3300' }} />
    </div>
  )
}

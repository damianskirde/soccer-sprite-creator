interface Props {
  onBack?: () => void
  onForward?: () => void
  forwardLabel?: string
  forwardDisabled?: boolean
}

const BTN: React.CSSProperties = {
  width: 56,
  height: 56,
  background: '#000',
  border: '3px solid #CC3300',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  fontSize: 16,
  color: '#fff',
  flexShrink: 0,
}

export default function NavFooter({ onBack, onForward, forwardLabel = '▶▶', forwardDisabled }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {onBack ? (
        <button style={{ ...BTN, pointerEvents: 'auto' }} onClick={onBack}>
          ◄
        </button>
      ) : (
        <div style={{ width: 56 }} />
      )}
      {onForward ? (
        <button
          style={{
            ...BTN,
            pointerEvents: 'auto',
            opacity: forwardDisabled ? 0.4 : 1,
            cursor: forwardDisabled ? 'not-allowed' : 'pointer',
          }}
          onClick={forwardDisabled ? undefined : onForward}
          disabled={forwardDisabled}
        >
          {forwardLabel}
        </button>
      ) : (
        <div style={{ width: 56 }} />
      )}
    </div>
  )
}

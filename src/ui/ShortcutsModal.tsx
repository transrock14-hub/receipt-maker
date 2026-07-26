import './ShortcutsModal.css'

const ROWS: Array<{ keys: string; action: string }> = [
  { keys: '⌘ Z', action: 'Undo' },
  { keys: '⌘ ⇧ Z', action: 'Redo' },
  { keys: '⌘ S', action: 'Save project' },
  { keys: '⌘ D', action: 'Duplicate selection' },
  { keys: 'Delete', action: 'Delete selection' },
  { keys: 'G', action: 'Refresh generate preview' },
  { keys: 'D', action: 'Download screenshot' },
  { keys: 'C', action: 'Copy screenshot' },
  { keys: '← → ↑ ↓', action: 'Nudge selection 1px' },
  { keys: '⇧ + arrows', action: 'Nudge selection 10px' },
  { keys: 'Enter', action: 'Edit selected text' },
  { keys: '?', action: 'Show this cheatsheet' },
]

type Props = {
  open: boolean
  onClose: () => void
}

export function ShortcutsModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div className="shortcuts-backdrop" role="presentation" onClick={onClose}>
      <div
        className="shortcuts-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-head">
          <h2 id="shortcuts-title">Keyboard shortcuts</h2>
          <button type="button" className="shortcuts-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <ul className="shortcuts-list">
          {ROWS.map((row) => (
            <li key={row.keys}>
              <kbd>{row.keys}</kbd>
              <span>{row.action}</span>
            </li>
          ))}
        </ul>
        <p className="shortcuts-note">Shortcuts are ignored while typing in inputs or text boxes.</p>
      </div>
    </div>
  )
}

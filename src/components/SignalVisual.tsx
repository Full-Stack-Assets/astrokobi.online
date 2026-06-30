const palette: Record<string, { primary: string; secondary: string }> = {
  cosmos: { primary: '#9dffe5', secondary: '#7f8cff' },
  intelligence: { primary: '#ff9b7a', secondary: '#b48cff' },
  futures: { primary: '#f4ff74', secondary: '#49d6ff' },
};

export function SignalVisual({ category, index = 0, compact = false }: {
  category: string;
  index?: number;
  compact?: boolean;
}) {
  const colors = palette[category] ?? palette.futures;
  const rotation = (index * 23 + 8) % 90;

  return (
    <div
      className={`signal-visual ${compact ? 'signal-visual--compact' : ''}`}
      style={{
        '--signal-primary': colors.primary,
        '--signal-secondary': colors.secondary,
        '--signal-rotation': `${rotation}deg`,
      } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="signal-grid" />
      <div className="signal-orbit signal-orbit--one" />
      <div className="signal-orbit signal-orbit--two" />
      <div className="signal-core" />
      <div className="signal-scan" />
      <span className="signal-coordinate">{String(index + 1).padStart(2, '0')} / ∞</span>
    </div>
  );
}

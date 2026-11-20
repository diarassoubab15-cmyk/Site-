export function Cube({ size = 260 }: { size?: number }) {
  return (
    <div className="cube-scene flex items-center justify-center" aria-hidden="true">
      <div className="cube" style={{ ["--s" as string]: `${size}px` }}>
        <span /><span /><span /><span /><span /><span />
      </div>
    </div>
  );
}

export default function Marquee({ text = '', items = null, speedSec = 20, className = '', separator = '•' }) {
  const style = { animationDuration: `${Math.max(5, speedSec)}s` };
  const seq = Array.isArray(items) && items.length ? items : [text];
  const Chunk = () => (
    <div className="marquee-content whitespace-nowrap">
      {seq.map((t, i) => (
        <span key={`m1-${i}`} className="mx-6 inline-flex items-center">
          {t}
          {separator && i < seq.length - 1 ? <span className="mx-6 opacity-70">{separator}</span> : null}
        </span>
      ))}
    </div>
  );
  return (
    <div className={`overflow-hidden w-full bg-brandHeader text-white ${className}`} aria-label="Avisos">
      <div className="marquee-track" style={style}>
        <Chunk />
        <Chunk aria-hidden="true" />
      </div>
    </div>
  );
}
interface CursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

export const RemoteCursor: React.FC<CursorProps> = ({ x, y, color, name }) => {
  if(!x || !y) return;
  return (
    <div
      className="fixed top-0 left-0 z-[9999] pointer-events-none transition-transform duration-1000 ease-linear will-change-transform z-20"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="drop-shadow-md"
        style={{ fill: color }}
      >
        <path d="M7 2l12 11.2-5.8.8 3.3 6.1-2.2 1.2-3.3-6.1-4 3.8V2z" />
      </svg>

      <div
        className="ml-3 px-2 py-0.5 rounded-sm text-xs font-bold text-white whitespace-nowrap shadow-sm"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
};

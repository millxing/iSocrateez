import { useEffect, useState } from "react";

interface LoadingOverlayProps {
  startTime: number;
}

const PHASES = [
  { after: 0, message: "Forming the prompt..." },
  { after: 3000, message: "Consulting the oracle..." },
  { after: 10000, message: "Still thinking..." },
  { after: 20000, message: "Almost there..." }
];

export function LoadingOverlay({ startTime }: LoadingOverlayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const phase = [...PHASES].reverse().find((p) => elapsed >= p.after);
  const seconds = (elapsed / 1000).toFixed(1);

  return (
    <div className="loading-overlay">
      <p className="loading-message">{phase?.message}</p>
      <p className="loading-timer">{seconds}s</p>
    </div>
  );
}

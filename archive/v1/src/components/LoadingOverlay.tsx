import { useEffect, useState } from "react";

const PHILOSOPHERS = [
  "Socrates", "Plato", "Aristotle", "Epicurus", "Diogenes", "Zeno", "Epictetus", "Seneca",
  "Aurelius", "Cicero", "Confucius", "Mencius", "Xunzi", "Laozi", "Zhuangzi", "Mozi",
  "Nagarjuna", "Shantideva", "Augustine", "Aquinas", "Maimonides", "Avicenna", "Averroes",
  "Al-Ghazali", "Hobbes", "Locke", "Hume", "Rousseau", "Spinoza", "Leibniz", "Kant", "Bentham",
  "Mill", "Sidgwick", "Hegel", "Kierkegaard", "Schopenhauer", "Nietzsche", "Marx", "Peirce",
  "James", "Dewey", "Moore", "Ross", "Rawls", "Nozick", "Foot", "Anscombe", "Singer", "Parfit",
  "Gilligan", "Noddings", "Beauvoir", "Sartre", "Arendt", "Levinas", "Buber", "Nagel",
  "Williams", "MacIntyre", "Korsgaard", "Scanlon", "Dancy", "Murdoch", "Wollstonecraft"
];

interface FloatingName {
  id: number;
  name: string;
  sx: number;
  sy: number;
  duration: number;
}

let nextNameId = 0;

function spawnName(): FloatingName {
  const angle = Math.random() * Math.PI * 2;
  return {
    id: nextNameId++,
    name: PHILOSOPHERS[Math.floor(Math.random() * PHILOSOPHERS.length)],
    // Start just past the viewport border, in vw/vh units from the center.
    sx: Math.cos(angle) * 60,
    sy: Math.sin(angle) * 60,
    duration: 6 + Math.random() * 3
  };
}

function FloatingNames() {
  const [names, setNames] = useState<FloatingName[]>([]);

  useEffect(() => {
    const add = () => setNames((cur) => [...cur.slice(-14), spawnName()]);
    add();
    const interval = setInterval(add, 550);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="floating-names" aria-hidden="true">
      {names.map((n) => (
        <span
          key={n.id}
          className="floating-name"
          style={
            {
              "--sx": n.sx,
              "--sy": n.sy,
              animationDuration: `${n.duration}s`
            } as React.CSSProperties
          }
        >
          {n.name}
        </span>
      ))}
    </div>
  );
}

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
      <FloatingNames />
      <p className="loading-message loading-front">{phase?.message}</p>
      <p className="loading-timer loading-front">{seconds}s</p>
    </div>
  );
}

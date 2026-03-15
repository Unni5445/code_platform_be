import { useMemo } from "react";

export default function Particles() {
  const particles = useMemo(() => {
    const count = window.innerWidth < 600 ? 18 : 32;
    return Array.from({ length: count }, () => {
      const size = Math.random() * 3 + 2;
      return {
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        bottom: `${Math.random() * 100}%`,
        animationDuration: `${Math.random() * 20 + 16}s`,
        animationDelay: `${Math.random() * -20}s`,
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {particles.map((style, i) => (
        <span
          key={i}
          className="absolute animate-[landing-particle_linear_infinite] rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.9),transparent)] opacity-[0.22] blur-[1px]"
          style={style}
        />
      ))}
    </div>
  );
}

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const start = Date.now();
    const duration = 2200;
    const raf = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setVisible(false);
          setTimeout(onDone, 600);
        }, 200);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-ocid="splash.loading_state"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, oklch(0.85 0.18 85 / 0.08) 0%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col items-center gap-3">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "oklch(0.92 0.18 85)" }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.6], scale: [0, 1.5, 1] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            <motion.h1
              className="font-display text-6xl md:text-8xl font-bold tracking-tight select-none"
              style={{
                color: "oklch(0.97 0.01 85)",
                textShadow:
                  "0 0 40px oklch(0.85 0.18 85 / 0.5), 0 0 80px oklch(0.85 0.18 85 / 0.25), 0 2px 4px rgba(0,0,0,0.8)",
              }}
              initial={{ opacity: 0, scale: 0.82, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.15,
              }}
            >
              Sarthak
            </motion.h1>

            <motion.p
              className="text-sm tracking-[0.35em] uppercase"
              style={{ color: "oklch(0.7 0.06 85)" }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.55 }}
            >
              Reel Editor
            </motion.p>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 md:w-64">
            <div
              className="h-px w-full rounded-full overflow-hidden"
              style={{ background: "oklch(0.3 0 0)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.75 0.16 85), oklch(0.92 0.18 85))",
                  boxShadow: "0 0 8px oklch(0.85 0.18 85 / 0.8)",
                  scaleX: progress,
                  transformOrigin: "left",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

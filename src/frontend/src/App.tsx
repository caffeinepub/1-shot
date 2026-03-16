import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { SplashScreen } from "./components/SplashScreen";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { Dashboard } from "./pages/Dashboard";
import { Editor } from "./pages/Editor";
import { LoginPage } from "./pages/LoginPage";

export type View =
  | { type: "dashboard" }
  | { type: "editor"; projectId?: string };

const SPRING_EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const EASE_OUT = [0.4, 0, 1, 1] as [number, number, number, number];

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [view, setView] = useState<View>({ type: "dashboard" });
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: "oklch(0.75 0.16 85 / 0.8)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  return (
    <AnimatePresence mode="wait">
      {view.type === "editor" ? (
        <motion.div
          key="editor"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, ease: SPRING_EASE },
          }}
          exit={{
            opacity: 0,
            scale: 0.96,
            transition: { duration: 0.25, ease: EASE_OUT },
          }}
          style={{ position: "fixed", inset: 0, zIndex: 10 }}
        >
          <Editor
            projectId={view.projectId}
            onBack={() => setView({ type: "dashboard" })}
          />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, ease: SPRING_EASE },
          }}
          exit={{
            opacity: 0,
            scale: 0.96,
            transition: { duration: 0.25, ease: EASE_OUT },
          }}
          style={{ position: "fixed", inset: 0 }}
        >
          <Dashboard
            onOpenEditor={(id) => setView({ type: "editor", projectId: id })}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { Button } from "../components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 gap-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Sarthak
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">Your reels editing studio</p>
      </div>
      <Button
        data-ocid="login.primary_button"
        onClick={login}
        disabled={isLoggingIn}
        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-lg"
      >
        {isLoggingIn ? "Connecting..." : "Sign in with Internet Identity"}
      </Button>
    </div>
  );
}

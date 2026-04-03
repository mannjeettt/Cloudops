import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Cloud, Lock, Mail } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("admin@cloudops.io");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 py-10 text-slate-50">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur">
            <div className="mb-10 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300">
                <Cloud className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/70">CloudOps</p>
                <h1 className="text-4xl font-semibold">Operations command center</h1>
              </div>
            </div>
            <div className="grid gap-4 text-sm text-slate-300 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500">Live Pipelines</p>
                <p className="text-2xl font-semibold text-white">GitHub, GitLab, Jenkins</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500">Realtime</p>
                <p className="text-2xl font-semibold text-white">Alerts and metrics over sockets</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500">Access</p>
                <p className="text-2xl font-semibold text-white">Role-aware routes and settings</p>
              </div>
            </div>
          </div>

          <Card className="border-white/10 bg-slate-950/80 text-slate-50 shadow-2xl">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription className="text-slate-400">
                Use your CloudOps account to access protected dashboards and settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="border-white/10 bg-slate-900 pl-10"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      className="border-white/10 bg-slate-900 pl-10"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                </div>

                {error ? <p className="text-sm text-rose-400">{error}</p> : null}

                <Button type="submit" className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;

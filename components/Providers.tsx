"use client";

import { AppStateProvider } from "./AppState";
import { AuthProvider } from "./AuthContext";
import { DiagnosisSyncOnLogin } from "./DiagnosisSyncOnLogin";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppStateProvider>
        <DiagnosisSyncOnLogin />
        {children}
      </AppStateProvider>
    </AuthProvider>
  );
}

"use client";

import { Suspense } from "react";
import { TeamSettingClient } from "./team-setting-client";

export default function TeamSettingPage() {
  return (
    <Suspense fallback={<div className="page" />}> 
      <TeamSettingClient />
    </Suspense>
  );
}

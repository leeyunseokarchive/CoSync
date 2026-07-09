"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import type { AgreementDoc } from "../lib/consensus";

export function useAgreements(teamId: string | undefined) {
  const [agreements, setAgreements] = useState<AgreementDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setAgreements([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, "teams", teamId, "agreements"), orderBy("version", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAgreements(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AgreementDoc, "id">) }))
      );
      setLoading(false);
    }, (err) => {
      console.error("Agreements listen error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [teamId]);

  return { agreements, loading };
}

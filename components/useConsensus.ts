"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import type { ConsensusDoc } from "../lib/consensus";

export function useConsensus(teamId: string | undefined) {
  const [items, setItems] = useState<Record<string, ConsensusDoc>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setItems({});
      setLoading(false);
      return;
    }
    const ref = collection(db, "teams", teamId, "consensus");
    const unsubscribe = onSnapshot(ref, (snap) => {
      const next: Record<string, ConsensusDoc> = {};
      snap.docs.forEach((d) => {
        next[d.id] = d.data() as ConsensusDoc;
      });
      setItems(next);
      setLoading(false);
    }, (err) => {
      console.error("Consensus listen error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [teamId]);

  return { items, loading };
}

"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { onListenError } from "../lib/listenError";
import type { ConsensusComment } from "../lib/consensus";

export function useComments(teamId: string | undefined, field: string | null) {
  const [comments, setComments] = useState<ConsensusComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId || !field) {
      setComments([]);
      setLoading(false);
      return;
    }
    const ref = query(
      collection(db, "teams", teamId, "consensus", field, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setComments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ConsensusComment, "id">) })));
        setLoading(false);
      },
      (err) => {
        onListenError("Comments")(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [teamId, field]);

  return { comments, loading };
}

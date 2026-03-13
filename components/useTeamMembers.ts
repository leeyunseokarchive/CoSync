"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  status: string;
  progress: number;
  answers?: {
    repeatCount?: number | string;
    timeElapsed?: number | string;
    timeElapsedUnit?: string;
    decisionDeadline?: number | string;
    decisionDeadlineUnit?: string;
    decisionRule?: string;
    decisionMaker?: string;
  };
};

export function useTeamMembers(teamId: string | undefined) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!teamId) {
        setMembers([]);
        setLoading(false);
        return;
      }
      try {
        const membersRef = collection(db, "teams", teamId, "members");
        const q = query(membersRef, orderBy("name"));
        const snapshot = await getDocs(q);
        setMembers(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<TeamMember, "id">)
          }))
        );
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [teamId]);

  return { members, loading };
}

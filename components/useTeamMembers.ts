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
    decisionStructure?: string;
    decisionConfirmation?: string;
    deadlockRepeat?: string;
    deadlockDays?: string;
    extraWorkPrinciple?: string;
    extraWorkPriority?: string;
    motivationChoices?: string[];
    workType?: string;
    boundaryTasks?: string[];
    allocationRule?: string;
    burdenTasks?: string[];
    conflictRepeat?: string;
    conflictWeeks?: string;
    agendaOwners?: Record<string, { lead: string; approver: string }>;
    customAgendaName?: string;
    customAgendaOwner?: { lead: string; approver: string };
    exitRecoveryItems?: string[];
    handoverMethod?: string;
    exitCleanupHours?: string;
    exitCleanupDays?: string;
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

"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";

type Team = {
  id: string;
  name: string;
  inviteCode: string;
  members: string[];
  createdBy: string;
  industry?: string;
  stage?: string;
  progress?: number;
  gapCount?: number;
  gapScore?: "LOW" | "MID" | "HIGH";
  status?: string;
};

export function useTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      setError(null);
      if (!user) {
        setTeams([]);
        setLoading(false);
        return;
      }
      try {
        const teamsRef = collection(db, "teams");
        const q = query(teamsRef, where("members", "array-contains", user.uid));
        const snapshot = await getDocs(q);
        const nextTeams = snapshot.docs
          .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Team, "id">)
          }))
          .filter((team) => team.status !== "archived");
        setTeams(nextTeams);
      } catch (err) {
        setError("팀 정보를 불러오지 못했습니다.");
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [user]);

  return { teams, loading, error };
}

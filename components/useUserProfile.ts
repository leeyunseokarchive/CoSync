"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";

type UserProfile = {
  name: string;
  email: string;
  department?: string;
  role?: string;
  teamIds?: string[];
  lastActiveTeamId?: string;
};

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const docRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      setProfile((snap.data() as UserProfile) ?? null);
      setLoading(false);
    }, (err) => {
      console.error("Profile listen error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { profile, loading };
}

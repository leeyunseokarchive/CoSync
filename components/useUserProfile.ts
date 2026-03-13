"use client";

import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";

type UserProfile = {
  name: string;
  email: string;
  department?: string;
  role?: string;
  teamIds?: string[];
};

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      setProfile((snap.data() as UserProfile) ?? null);
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
}

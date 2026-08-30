"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { onListenError } from "../lib/listenError";
import { useAuth } from "./AuthContext";

type UserProfile = {
  name: string;
  email: string;
  department?: string;
  role?: string;
  teamIds?: string[];
  lastActiveTeamId?: string;
  plan?: "free" | "premium";
  subscriptionStatus?: "active" | "past_due" | "canceled" | "expired";
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
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        
        // Lazy migration for legacy schemas
        if (data.plan === undefined || data.subscriptionStatus === undefined) {
          import("firebase/firestore").then(({ updateDoc }) => {
            updateDoc(docRef, {
              plan: data.plan ?? "free",
              subscriptionStatus: data.subscriptionStatus ?? "expired"
            }).catch(err => console.error("Failed to lazy migrate user schema:", err));
          });
        }
        
        setProfile(data);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (err) => {
      onListenError("Profile")(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { profile, loading };
}

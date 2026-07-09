import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Clause } from "./agreementClauses";

export type VoteChoice = "approve" | "reject";

export type ConsensusProposal = {
  byUid: string;
  byName: string;
  option: string;
  clauseText: string;
  proposedAt: Timestamp | null;
};

export type ConsensusDoc = {
  status: "voting" | "resolved";
  proposal: ConsensusProposal;
  votes: Record<string, VoteChoice>;
  resolvedOption?: string;
  resolvedClause?: string;
};

export type AgreementDoc = {
  id: string;
  version: number;
  createdAt: Timestamp | null;
  createdBy: string;
  createdByName: string;
  status: "pending_confirmation" | "confirmed";
  confirmations: Record<string, Timestamp | null>;
  clauses: Clause[];
};

// 제안(재제안 포함): proposal 덮어쓰고 votes 리셋, 제안자는 자동 approve
export async function propose(
  teamId: string,
  field: string,
  uid: string,
  name: string,
  option: string,
  clauseText: string
) {
  await setDoc(doc(db, "teams", teamId, "consensus", field), {
    status: "voting",
    proposal: { byUid: uid, byName: name, option, clauseText, proposedAt: serverTimestamp() },
    votes: { [uid]: "approve" },
  });
}

// 투표. 트랜잭션으로 최신 문서 기준 판정 — 동시 투표/재제안 교차 레이스 방지.
// seen: 투표자가 화면에서 본 제안. 트랜잭션 시점의 제안과 다르면(재제안됨) 투표를 버린다.
export async function vote(
  teamId: string,
  field: string,
  uid: string,
  choice: VoteChoice,
  memberUids: string[],
  seen: ConsensusDoc
) {
  const ref = doc(db, "teams", teamId, "consensus", field);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const cur = snap.data() as ConsensusDoc;
    if (cur.status === "resolved") return;
    if (
      cur.proposal.byUid !== seen.proposal.byUid ||
      cur.proposal.option !== seen.proposal.option ||
      cur.proposal.clauseText !== seen.proposal.clauseText
    ) {
      return; // 그 사이 새 제안으로 교체됨 — 이 투표는 무효
    }
    const votes = { ...cur.votes, [uid]: choice };
    const allApproved = memberUids.every((m) => votes[m] === "approve");
    tx.update(ref, {
      votes,
      ...(allApproved
        ? { status: "resolved", resolvedOption: cur.proposal.option, resolvedClause: cur.proposal.clauseText }
        : {}),
    });
  });
}

// 합의 완료된 항목 재논의: 문서 삭제 → "제안 필요" 상태로 복귀
export async function reopen(teamId: string, field: string) {
  await deleteDoc(doc(db, "teams", teamId, "consensus", field));
}

export async function finalizeAgreement(
  teamId: string,
  uid: string,
  name: string,
  clauses: Clause[],
  nextVersion: number
) {
  const ref = await addDoc(collection(db, "teams", teamId, "agreements"), {
    version: nextVersion,
    createdAt: serverTimestamp(),
    createdBy: uid,
    createdByName: name,
    status: "pending_confirmation",
    confirmations: {},
    clauses,
  });
  return ref.id;
}

// 트랜잭션: 마지막 두 명이 동시에 확정해도 status가 확정으로 넘어가도록 보장
export async function confirmAgreement(
  teamId: string,
  agreementId: string,
  uid: string,
  memberUids: string[]
) {
  const ref = doc(db, "teams", teamId, "agreements", agreementId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const cur = snap.data() as Omit<AgreementDoc, "id">;
    const confirmed = new Set(Object.keys(cur.confirmations || {}));
    confirmed.add(uid);
    const allConfirmed = memberUids.every((m) => confirmed.has(m));
    tx.update(ref, {
      [`confirmations.${uid}`]: serverTimestamp(),
      ...(allConfirmed ? { status: "confirmed" } : {}),
    });
  });
}

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
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
// 트랜잭션으로 최신 문서 기준 판정 — 동시 최초 제안/재제안 레이스 방지.
// 다음 경우에만 덮어쓸 수 있다: 문서가 없을 때 / 반대표가 있을 때 / 호출자가 현재 제안자 본인일 때(수정).
// 그 외(다른 사람이 낸 제안이 반대 없이 진행 중이거나 resolved)는 조용히 버려진다 —
// 호출자는 실시간 구독으로 먼저 반영된 제안을 그대로 보게 된다.
export async function propose(
  teamId: string,
  field: string,
  uid: string,
  name: string,
  option: string,
  clauseText: string
) {
  const ref = doc(db, "teams", teamId, "consensus", field);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      const cur = snap.data() as ConsensusDoc;
      const hasReject = Object.values(cur.votes || {}).includes("reject");
      const isOwner = cur.proposal.byUid === uid;
      if (cur.status === "resolved" || (!hasReject && !isOwner)) return;
    }
    tx.set(ref, {
      status: "voting",
      proposal: { byUid: uid, byName: name, option, clauseText, proposedAt: serverTimestamp() },
      votes: { [uid]: "approve" },
    });
  });
}

// 투표. 트랜잭션으로 최신 문서 기준 판정 — 동시 투표/재제안 교차 레이스 방지.
// seen: 투표자가 화면에서 본 제안. 트랜잭션 시점의 제안과 다르면(재제안됨) 투표를 버린다.
// 전원 동의 판정은 트랜잭션 안에서 읽은 team.members 기준 — 투표 도중 합류한 팀원 누락 방지.
export async function vote(
  teamId: string,
  field: string,
  uid: string,
  choice: VoteChoice,
  seen: ConsensusDoc
) {
  const ref = doc(db, "teams", teamId, "consensus", field);
  await runTransaction(db, async (tx) => {
    // Firestore 트랜잭션은 모든 읽기가 쓰기보다 먼저여야 한다.
    const teamSnap = await tx.get(doc(db, "teams", teamId));
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const memberUids: string[] = teamSnap.data()?.members || [];
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

export type ConsensusComment = {
  id: string;
  byUid: string;
  byName: string;
  text: string;
  createdAt: Timestamp | null;
};

// 항목(field) 단위로 붙는 댓글 — 제안이 수정/재제안되어도 대화 맥락은 남는다.
export async function addComment(
  teamId: string,
  field: string,
  uid: string,
  name: string,
  text: string
) {
  await addDoc(collection(db, "teams", teamId, "consensus", field, "comments"), {
    byUid: uid,
    byName: name,
    text,
    createdAt: serverTimestamp(),
  });
}

export async function deleteComment(teamId: string, field: string, commentId: string) {
  await deleteDoc(doc(db, "teams", teamId, "consensus", field, "comments", commentId));
}

// 결정적 문서 ID(v{버전})로 생성 — 동시 생성 시 같은 버전의 중복 합의안 방지
export async function finalizeAgreement(
  teamId: string,
  uid: string,
  name: string,
  clauses: Clause[],
  nextVersion: number
) {
  const id = `v${nextVersion}`;
  const ref = doc(db, "teams", teamId, "agreements", id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error("이미 같은 버전의 합의안이 생성되어 있습니다.");
    tx.set(ref, {
      version: nextVersion,
      createdAt: serverTimestamp(),
      createdBy: uid,
      createdByName: name,
      status: "pending_confirmation",
      confirmations: {},
      clauses,
    });
  });
  return id;
}

// 미확정(pending_confirmation) 합의안 파기 — 보안 규칙상 pending 상태 문서만 삭제 가능
export async function discardPendingAgreement(teamId: string, agreementId: string) {
  await deleteDoc(doc(db, "teams", teamId, "agreements", agreementId));
}

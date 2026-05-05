import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MentorCapstoneReview from "@/components/mentor/MentorCapstoneReview";
import {
  getMentorCapstoneServer,
  getMentorQueueServer,
} from "@/lib/api/mentor-capstone.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fellowId: string }>;
}): Promise<Metadata> {
  const { fellowId } = await params;
  const queue = await getMentorQueueServer();
  const entry = queue.find((q) => q.fellowId === fellowId);
  if (!entry) return { title: "Capstone not found · AI Fellows LMS" };
  return {
    title: `${entry.fellowName} · Capstone review · AI Fellows LMS`,
    description: `Review ${entry.fellowName}'s capstone draft and reply on the feedback thread.`,
  };
}

export default async function MentorCapstoneReviewPage({
  params,
}: {
  params: Promise<{ fellowId: string }>;
}) {
  const { fellowId } = await params;
  const [capstone, queue] = await Promise.all([
    getMentorCapstoneServer(fellowId),
    getMentorQueueServer(),
  ]);
  if (!capstone) notFound();

  const entry = queue.find((q) => q.fellowId === fellowId);
  if (!entry) notFound();

  // The server fetcher attaches the real backend id when available so the
  // mentor's review form can POST to /capstones/:id/review.
  const backendCapstoneId =
    "backendId" in capstone
      ? (capstone as { backendId: string }).backendId
      : null;

  return (
    <MentorCapstoneReview
      capstone={capstone}
      backendCapstoneId={backendCapstoneId}
      fellowName={entry.fellowName}
      fellowEmail={entry.fellowEmail}
      fellowCountry={entry.fellowCountry}
    />
  );
}

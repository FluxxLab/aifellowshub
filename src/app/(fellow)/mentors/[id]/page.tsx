import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import MentorRequestForm from "@/components/fellow/MentorRequestForm";
import { getMentorServer } from "@/lib/api/mentorship.server";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const mentor = await getMentorServer(id);
  if (!mentor) return { title: "Mentor not found · AI Fellows LMS" };
  return {
    title: `Request coaching · ${mentor.fullName} · AI Fellows LMS`,
    description: `Request a 1:1 coaching session with ${mentor.fullName}.`,
  };
}

export default async function MentorBookingPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const mentor = await getMentorServer(id);
  if (!mentor) notFound();
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Mentors", href: "/mentors" },
          { label: mentor.fullName },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          {mentor.fullName}
        </h1>
        {mentor.sector && (
          <p className="mt-1 text-sm uppercase tracking-wide text-gray-500">
            {mentor.sector.replaceAll("_", " ")}
          </p>
        )}
        {mentor.bio && (
          <p className="mt-3 max-w-2xl text-gray-600">{mentor.bio}</p>
        )}
      </div>
      <MentorRequestForm mentorId={mentor.id} />
    </div>
  );
}

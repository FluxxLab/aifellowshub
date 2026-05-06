import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import MentorBookingPicker from "@/components/fellow/MentorBookingPicker";
import { getMentorAvailabilityServer } from "@/lib/api/mentorship.server";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const data = await getMentorAvailabilityServer(id);
  if (!data) return { title: "Mentor not found · AI Fellows LMS" };
  return {
    title: `Book ${data.mentor.fullName} · AI Fellows LMS`,
    description: `Schedule a 1:1 with ${data.mentor.fullName}.`,
  };
}

export default async function MentorBookingPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const data = await getMentorAvailabilityServer(id);
  if (!data) notFound();
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Mentors", href: "/mentors" },
          { label: data.mentor.fullName },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          {data.mentor.fullName}
        </h1>
        {data.mentor.sector && (
          <p className="mt-1 text-sm uppercase tracking-wide text-gray-500">
            {data.mentor.sector.replaceAll("_", " ")}
          </p>
        )}
        {data.mentor.bio && (
          <p className="mt-3 max-w-2xl text-gray-600">{data.mentor.bio}</p>
        )}
      </div>
      <MentorBookingPicker mentorId={data.mentor.id} slots={data.slots} />
    </div>
  );
}

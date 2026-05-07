import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { ChevronRightIcon } from "@/icons";
import { listMentorsForBrowseServer } from "@/lib/api/mentorship.server";

export const metadata: Metadata = {
  title: "Mentors · AI Fellows LMS",
  description: "Browse mentors and book a 1:1 session.",
};

export default async function MentorsBrowsePage() {
  const mentors = await listMentorsForBrowseServer();
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/home" }, { label: "Mentors" }]} />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">Mentors</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Browse mentors in your cohort and book a 1:1 session. An admin
          confirms each booking and hosts the call.
        </p>
      </div>
      {mentors.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            No mentors are listed yet.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <li key={m.id}>
              <Link
                href={`/mentors/${m.id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-fellowship-navy/30 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800">
                    {m.fullName}
                  </h3>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                </div>
                {m.sector && (
                  <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                    {m.sector.replaceAll("_", " ")}
                  </p>
                )}
                {m.bio && (
                  <p className="mt-3 line-clamp-3 text-sm text-gray-600">
                    {m.bio}
                  </p>
                )}
                <p className="mt-4 text-xs font-medium text-fellowship-navy">
                  Request a coaching session →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

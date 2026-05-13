import { getModuleFeedbackAggregateServer } from "@/lib/api/feedback.server";

/**
 * Admin / faculty / super_admin view of a module's feedback. Server
 * component — renders nothing if the backend is unreachable or the
 * caller lacks access. Fellow identities are stripped server-side
 * (BRD §6.10 anonymity); this UI must never join feedback rows back to
 * users.
 */
export default async function ModuleFeedbackPanel({
  moduleId,
}: {
  moduleId: string;
}) {
  const data = await getModuleFeedbackAggregateServer(moduleId);
  if (!data) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Fellow feedback
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Anonymous end-of-module ratings and comments. Submitting is
            required for fellows before the next module unlocks.
          </p>
        </div>
        <p className="text-xs font-medium text-gray-500">
          {data.count} {data.count === 1 ? "response" : "responses"}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AverageTile label="Overall" value={data.averages.overall} />
        <AverageTile label="Content" value={data.averages.content} />
        <AverageTile label="Sessions" value={data.averages.sessions} />
        <AverageTile label="Mentor" value={data.averages.mentor} />
      </div>

      {data.submissions.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          No feedback submitted yet.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {data.submissions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>
                  Overall <strong className="text-gray-800">{s.overallRating}</strong>/5
                </span>
                <span>·</span>
                <span>
                  Content <strong className="text-gray-800">{s.contentRating}</strong>/5
                </span>
                <span>·</span>
                <span>
                  Sessions <strong className="text-gray-800">{s.sessionRating}</strong>/5
                </span>
                <span>·</span>
                <span>
                  Mentor <strong className="text-gray-800">{s.mentorRating}</strong>/5
                </span>
                <span className="ml-auto">
                  {new Date(s.submittedAt).toLocaleDateString(undefined, {
                    timeZone: "Africa/Lagos",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {(s.whatWorked || s.whatDidnt) && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {s.whatWorked && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        What worked
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {s.whatWorked}
                      </p>
                    </div>
                  )}
                  {s.whatDidnt && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        What didn&apos;t
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {s.whatDidnt}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AverageTile({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-800">
        {value === null ? "—" : `${value.toFixed(1)} / 5`}
      </p>
    </div>
  );
}

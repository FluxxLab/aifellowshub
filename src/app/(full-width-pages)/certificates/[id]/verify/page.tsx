import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import { CertificateCanvas } from "@/components/fellow/MyCertificatesView";
import { CheckLineIcon, CloseLineIcon } from "@/icons";
import { getPublicCertificateServer } from "@/lib/api/fellow-certificates.server";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const result = await getPublicCertificateServer(id);
  if (!result) return { title: "Certificate not found · AI Fellows" };
  return {
    title: `${result.certificate.fellowName} · ${result.certificate.cohortName} · AI Fellows`,
    description: `Public verification for ${result.certificate.fellowName}'s ${result.certificate.programmeName} certificate.`,
  };
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const result = await getPublicCertificateServer(id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public header — minimal, no auth */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-(--breakpoint-content) items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="inline-flex items-center gap-4">
            <Image
              src="/images/luminate.png"
              alt="Luminate"
              width={100}
              height={32}
              className="h-7 w-auto"
              priority
            />
            <Image
              src="/images/logo.png"
              alt="Africa Hub for Innovation & Development"
              width={140}
              height={40}
              className="h-8 w-auto"
              priority
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Certificate verification
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        {result === null ? (
          <NotFoundState id={id} />
        ) : (
          <VerifiedState
            certificate={result.certificate}
            verifiedAt={result.verifiedAt}
            valid={result.valid}
          />
        )}
      </main>

      <footer className="mt-12 border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-(--breakpoint-content) px-4 text-center text-xs text-gray-500 md:px-6">
          AI Ethics &amp; Governance Fellowship · Verified by the Policy
          Innovation Centre
        </div>
      </footer>
    </div>
  );
}

function VerifiedState({
  certificate: c,
  verifiedAt,
  valid,
}: {
  certificate: NonNullable<Awaited<ReturnType<typeof getPublicCertificateServer>>>["certificate"];
  verifiedAt: string;
  valid: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section
        className={`rounded-2xl border p-5 md:p-6 ${
          valid
            ? "border-success-200 bg-success-50"
            : "border-error-200 bg-error-50"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              valid
                ? "bg-success-500 text-white"
                : "bg-error-500 text-white"
            }`}
          >
            {valid ? (
              <CheckLineIcon className="h-5 w-5" />
            ) : (
              <CloseLineIcon className="h-5 w-5" />
            )}
          </span>
          <div className="flex-1">
            <Badge color={valid ? "success" : "error"}>
              {valid ? "Verified" : "Revoked"}
            </Badge>
            <h1 className="mt-2 text-xl font-bold text-gray-800">
              This certificate is {valid ? "valid" : "no longer valid"}.
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Issued by the Policy Innovation Centre, in partnership with the
              Africa Hub for Innovation &amp; Development. Verified at{" "}
              {new Date(verifiedAt).toLocaleString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              .
            </p>
          </div>
        </div>
      </section>

      <CertificateCanvas
        fellowName={c.fellowName}
        programmeName={c.programmeName}
        cohortName={c.cohortName}
        capstoneTitle={c.capstoneTitle}
        completedAtLabel={new Date(c.completedAt).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        signatories={c.signatories}
        isPreview={false}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h2 className="text-base font-semibold text-gray-800">
          Certificate details
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Holder" value={c.fellowName} />
          <Row label="Programme" value={c.programmeName} />
          <Row label="Cohort" value={c.cohortName} />
          <Row
            label="Issued"
            value={new Date(c.issuedAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          <Row label="Modules completed" value={`${c.modulesCompleted} / ${c.totalModules}`} />
          <Row label="Capstone" value={`"${c.capstoneTitle}"`} />
          <Row label="Certificate ID" value={c.id} mono />
        </dl>
      </section>

      {/*
        Support contact intentionally omitted — the original placeholder
        (`fellowship@aifellows.demo`) was not a real address. Drop a real
        contact mailto here when one is provisioned for the cohort.
      */}
      <p className="text-center text-xs text-gray-500">
        Spotted an issue with this certificate? Contact the programme
        team with the certificate ID below.
      </p>
    </div>
  );
}

function NotFoundState({ id }: { id: string }) {
  return (
    <section className="rounded-2xl border border-error-200 bg-error-50 p-8 text-center md:p-12">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error-500 text-white">
        <CloseLineIcon className="h-6 w-6" />
      </div>
      <Badge color="error">Not found</Badge>
      <h1 className="mt-2 text-xl font-bold text-gray-800">
        This certificate doesn&apos;t exist or has been revoked.
      </h1>
      <p className="mt-2 max-w-md mx-auto text-sm text-gray-600">
        The ID <span className="font-mono">{id}</span> doesn&apos;t match any
        issued Fellowship certificate. Double-check the URL, or contact the
        person who shared it.
      </p>
    </section>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-gray-100 py-2 last:border-b-0 sm:border-b-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`text-right text-gray-800 ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

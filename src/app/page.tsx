"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
 ArrowRightIcon,
 GroupIcon,
 CheckCircleIcon,
 BoxCubeIcon,
 ShootingStarIcon,
 DocsIcon,
} from "@/icons";
import { useCohortIsFull } from "@/lib/hooks/useCohortIsFull";
import { cn } from "@/lib/utils";

const features = [
 { Icon: DocsIcon, label: "Learn core concepts in AI ethics and governance" },
 { Icon: ShootingStarIcon, label: "Audit real-world AI systems" },
 { Icon: GroupIcon, label: "Engage with experts and peers across Africa" },
 { Icon: BoxCubeIcon, label: "Build a governance capstone project" },
 { Icon: CheckCircleIcon, label: "Present your work to government agencies and regulators" },
] as const;

const phases = [
 { weeks: "Weeks 1–3", title: "Foundations" },
 { weeks: "Weeks 4–8", title: "Core Competencies" },
 { weeks: "Weeks 9–11", title: "Capstone & Implementation" },
 { weeks: "Week 12", title: "Completion & Showcase" },
] as const;

export default function LandingPage() {
 const [scrolled, setScrolled] = useState(false);

 useEffect(() => {
 const onScroll = () => setScrolled(window.scrollY > 20);
 onScroll();
 window.addEventListener("scroll", onScroll, { passive: true });
 return () => window.removeEventListener("scroll", onScroll);
 }, []);

 return (
 <div className="min-h-screen bg-white">
 {/* NAV */}
 <header
 className={cn("fixed inset-x-0 top-0 z-50 transition-colors duration-300",
 scrolled
 ?"bg-white shadow-theme-sm":"bg-transparent")}
 >
 <div className="mx-auto flex h-[84px] max-w-(--breakpoint-content) items-center justify-between gap-6 px-6 lg:px-12 xl:px-16">
 {/* File-naming convention: `*-white.png` and `*white.png` = "for
     white background" (dark text); the non-suffixed version = "for
     dark background" (white text). So we render the white-text
     pair on the navy hero and the dark-text pair when scrolled. */}
 <Link href="/" className="inline-flex items-center gap-4">
 <Image
 src={scrolled ? "/images/luminatewhite.png" : "/images/luminate.png"}
 alt="Luminate"
 width={110}
 height={36}
 className="h-8 w-auto"
 priority
 />
 <Image
 src={scrolled ? "/images/white-logo.png" : "/images/logo.png"}
 alt="Africa Hub for Innovation & Development"
 width={160}
 height={48}
 className="h-10 w-auto"
 priority
 />
 </Link>
 {/* Single navbar CTA — `/signin` is the unified auth surface
     (sign-in form + Register section). The previous "Apply / Join"
     button was redundant and is gone. The hero CTA below still
     points at the Register section for explicit conversion. */}
 <div className="flex items-center gap-3">
 <Link
 href="/signin" className={cn("rounded-lg px-5 py-2.5 text-base font-medium transition",
 scrolled
 ?"text-gray-700 hover:bg-gray-100":"text-white hover:bg-white/10")}
 >
 Sign in
 </Link>
 </div>
 </div>
 </header>

 {/* HERO */}
 <section
 id="program" className="relative bg-fellowship-navy text-white" style={{
 backgroundImage:"linear-gradient(rgba(0, 45, 116, 0.82), rgba(0, 45, 116, 0.92)), url(/images/marketing/hero-bg.jpg)",
 backgroundSize:"cover",
 backgroundPosition:"center",
 }}
 >
 <div className="mx-auto flex min-h-[85vh] max-w-(--breakpoint-content) items-center px-6 lg:px-12 xl:px-16 pt-32 pb-24 md:pt-44 md:pb-36">
 <div className="max-w-4xl">
 <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
 Welcome to the{" "}
 <span className="text-pic-yellow">AI Ethics &amp; Governance Fellowship</span>.
 <span className="block mt-2">Your journey starts here.</span>
 </h1>
 <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
 Onboard, access your curriculum, track your progress, and complete
 your capstone over the next 12 weeks.
 </p>
 <div className="mt-8 flex flex-wrap gap-3">
 <Link
 href="/signin#register" className="inline-flex items-center gap-2 rounded-lg bg-pic-yellow px-6 py-3 text-base font-semibold text-fellowship-navy shadow-theme-sm transition hover:bg-pic-yellow-hover">
 Start your Fellowship
 <ArrowRightIcon className="h-4 w-4"/>
 </Link>
 <a
 href="#curriculum" className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-transparent px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10">
 Explore curriculum
 </a>
 </div>
 </div>
 </div>
 </section>

 {/* WELCOME — narrow, centred statement that bridges hero to detail. */}
 <section className="border-b border-gray-100 bg-white py-16 md:py-20">
 <div className="mx-auto max-w-3xl px-6 text-center lg:px-12">
 <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
 You are part of a select group shaping how AI is governed across
 Africa. Over the next 12 weeks, you will move from foundational
 knowledge to building real governance solutions.
 </p>
 </div>
 </section>

 {/* ABOUT */}
 <section className="mx-auto grid max-w-(--breakpoint-content) gap-10 px-6 lg:px-12 xl:px-16 py-20 md:grid-cols-12 md:py-28">
 <div className="md:col-span-5">
 <span className="text-xs font-semibold uppercase tracking-wider text-fellowship-navy">
 About the Fellowship
 </span>
 <h2 className="mt-2 text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
 A 12-week programme shaping responsible AI in Africa.
 </h2>
 </div>
 <div className="space-y-5 text-base leading-relaxed text-gray-600 md:col-span-7 md:text-lg">
 <p>
 The AI Ethics &amp; Governance Fellowship is a 12-week programme
 that equips African leaders with the skills, tools, and networks
 to design responsible and accountable AI systems.
 </p>
 <p>
 Delivered by the{" "}
 <strong className="text-gray-900">
 Policy Innovation Centre (PIC)
 </strong>{" "}
 in partnership with the{" "}
 <strong className="text-gray-900">
 Africa Hub for Innovation &amp; Development (AHFID)
 </strong>
 , with support from{" "}
 <strong className="text-gray-900">Luminate</strong>, the
 fellowship brings together policy professionals, regulators,
 researchers, and civil society leaders.
 </p>
 <p>
 Through a practical, hands-on approach, fellows develop
 real-world governance outputs — from policy frameworks to AI
 audit protocols — grounded in African contexts and ethical
 principles.
 </p>
 <p>
 More than a programme, it is a growing Pan-African network
 shaping the future of responsible AI.
 </p>
 </div>
 </section>

 {/* FEATURES */}
 <section id="features" className="bg-gray-50 py-20 md:py-28">
 <div className="mx-auto max-w-(--breakpoint-content) px-6 lg:px-12 xl:px-16">
 <div className="max-w-2xl">
 <span className="text-xs font-semibold uppercase tracking-wider text-fellowship-navy">
 Program Features
 </span>
 <h2 className="mt-2 text-3xl font-bold text-gray-900 md:text-5xl">
 What you&rsquo;ll do in this fellowship.
 </h2>
 </div>
 <ul className="mt-12 grid gap-4 md:grid-cols-2">
 {features.map(({ Icon, label }) => (
 <li
 key={label}
 className="group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-theme-lg"
 >
 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-pic-yellow text-fellowship-navy transition group-hover:bg-fellowship-navy group-hover:text-pic-yellow">
 <Icon className="h-5 w-5" />
 </span>
 <p className="pt-2 text-base font-semibold leading-snug text-gray-900 md:text-lg">
 {label}
 </p>
 </li>
 ))}
 </ul>
 </div>
 </section>

 {/* CURRICULUM — four phases over 12 weeks. */}
 <section
 id="curriculum"
 className="mx-auto max-w-(--breakpoint-content) px-6 lg:px-12 xl:px-16 py-20 md:py-28"
 >
 <div className="mx-auto max-w-5xl">
 <div className="mb-12 max-w-3xl">
 <span className="text-xs font-semibold uppercase tracking-wider text-fellowship-navy">
 12-Week Curriculum
 </span>
 <h2 className="mt-2 text-3xl font-bold text-gray-900 md:text-5xl">
 Four phases. One outcome.
 </h2>
 <p className="mt-5 text-base leading-relaxed text-gray-600 md:text-lg">
 The fellowship moves from foundational knowledge through core
 competencies into a hands-on capstone, capped by a public
 showcase to government and regulatory partners.
 </p>
 </div>

 <ol className="grid gap-4 md:grid-cols-2">
 {phases.map((phase, i) => (
 <li
 key={phase.title}
 className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:shadow-theme-lg"
 >
 <div className="flex items-center gap-3">
 <span className="flex h-10 w-10 items-center justify-center rounded-md bg-pic-yellow text-fellowship-navy font-bold transition group-hover:bg-fellowship-navy group-hover:text-pic-yellow">
 {i + 1}
 </span>
 <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
 {phase.weeks}
 </span>
 </div>
 <h3 className="mt-4 text-xl font-bold leading-snug text-gray-900">
 {phase.title}
 </h3>
 </li>
 ))}
 </ol>

 <div className="mt-10 flex justify-start">
 <Link
 href="/learning"
 className="inline-flex items-center gap-2 rounded-lg bg-fellowship-navy px-6 py-3 text-base font-semibold text-white shadow-theme-sm transition hover:bg-fellowship-navy-dark"
 >
 Go to Current Week
 <ArrowRightIcon className="h-4 w-4" />
 </Link>
 </div>
 </div>
 </section>

 {/* REGISTER FOR NEXT COHORT — minimal, centered, single CTA.
     Cohort-open vs cohort-full just swaps copy + button label;
     destination stays `/signin#register` (the register section
     handles the waitlist form when `?cohort=full` carries through).
     Wrapped in <Suspense> because `useCohortIsFull()` reads
     `useSearchParams()`, which Next 16 won't statically prerender
     without a Suspense boundary. The fallback shows the open-cohort
     copy — the common case — so SEO snapshots get sensible content. */}
 <Suspense fallback={<RegisterSection cohortIsFull={false} />}>
 <RegisterSectionWithSearchParams />
 </Suspense>

 {/* PARTNERS / CTA */}
 <section id="partners" className="bg-fellowship-navy text-white">
 <div className="mx-auto max-w-(--breakpoint-content) px-6 lg:px-12 xl:px-16 py-20 md:py-28">
 <div className="max-w-3xl">
 <h2 className="text-3xl font-bold leading-tight md:text-5xl">
 Join the foundation of a Pan-African network.
 </h2>
 <p className="mt-5 max-w-xl text-lg text-white/80">
 Apply now to be part of the cohort shaping how AI is governed
 across the continent.
 </p>
 <div className="mt-8 flex flex-wrap gap-3">
 <Link
 href="/signin#register" className="inline-flex items-center gap-2 rounded-lg bg-pic-yellow px-6 py-3 text-base font-semibold text-fellowship-navy shadow-theme-sm transition hover:bg-pic-yellow-hover">
 Start your Fellowship
 </Link>
 </div>
 </div>
 </div>
 </section>

 <footer className="border-t border-white/10 bg-fellowship-navy text-sm text-white/70">
 <div className="mx-auto flex max-w-(--breakpoint-content) flex-col items-center justify-between gap-4 px-6 lg:px-12 xl:px-16 py-8 md:flex-row">
 <p>
 © {new Date().getFullYear()} Policy Innovation Centre × AHFID. All
 rights reserved.
 </p>
 <p>With support from Luminate.</p>
 </div>
 </footer>
 </div>
 );
}

/**
 * Inner component that calls `useCohortIsFull()` (which uses
 * `useSearchParams()`). Must live behind a <Suspense> boundary so
 * Next 16 can prerender the page without query params resolved.
 */
function RegisterSectionWithSearchParams() {
 const cohortIsFull = useCohortIsFull();
 return <RegisterSection cohortIsFull={cohortIsFull} />;
}

function RegisterSection({ cohortIsFull }: { cohortIsFull: boolean }) {
 return (
 <section
 id="register"
 className="bg-white"
 aria-labelledby="register-section-heading"
 >
 <div className="mx-auto max-w-(--breakpoint-content) px-6 lg:px-12 xl:px-16 py-24 md:py-32">
 <div className="mx-auto max-w-2xl text-center">
 <h2
 id="register-section-heading"
 className="text-3xl font-bold leading-tight text-fellowship-navy md:text-5xl"
 >
 Your Fellowship Journey
 </h2>
 <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
 {cohortIsFull
 ? "Cohort 2026 is full. Add your name to the waitlist and we'll let you know when the next cohort opens."
 : "Ready to make a tangible impact on the future of AI governance? Applications are now open."}
 </p>
 <div className="mt-10 flex justify-center">
 <Link
 href="/signin#register"
 className="inline-flex items-center justify-center rounded-md bg-error-600 px-10 py-3.5 text-base font-semibold text-white shadow-theme-sm transition hover:bg-error-700 focus:outline-none focus:ring-3 focus:ring-error-600/20"
 >
 {cohortIsFull ? "Join the waitlist" : "Enter"}
 </Link>
 </div>
 </div>
 </div>
 </section>
 );
}

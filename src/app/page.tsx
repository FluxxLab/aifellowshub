"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
 Accordion,
 AccordionContent,
 AccordionItem,
 AccordionTrigger,
} from "@/components/ui/accordion/Accordion";
import {
 ArrowRightIcon,
 BoxIcon,
 GroupIcon,
 CheckCircleIcon,
 BoxCubeIcon,
 ShootingStarIcon,
 GridIcon,
 CalenderIcon,
 DocsIcon,
} from "@/icons";
import { useCohortIsFull } from "@/lib/hooks/useCohortIsFull";
import { cn } from "@/lib/utils";

const features = [
 {
 Icon: DocsIcon,
 title:"Rigorous, Industry-Relevant Curriculum",
 body:"Build a strong foundation in AI policy, risk governance, and regulatory strategy through hands-on, interactive learning.",
 },
 {
 Icon: GroupIcon,
 title:"Personalised Expert Mentorship",
 body:"Work closely with experienced practitioners who provide tailored guidance, feedback, and career direction.",
 },
 {
 Icon: GridIcon,
 title:"Access to a Global Network",
 body:"Collaborate with a diverse cohort of leaders across policy, tech, and research shaping the future of AI governance.",
 },
 {
 Icon: ShootingStarIcon,
 title:"AI-Powered Analytical Tools",
 body:"Use cutting-edge tools to assess AI systems, uncover bias, and evaluate real-world socio-economic impacts.",
 },
 {
 Icon: BoxCubeIcon,
 title:"Real-World Capstone Projects",
 body:"Develop practical AI governance solutions — policy briefs, audit protocols, impact assessments — deployable in real contexts.",
 },
 {
 Icon: CheckCircleIcon,
 title:"Accelerated Career Opportunities",
 body:"Unlock pathways to fellowships, leadership roles, and high-impact opportunities in leading organisations.",
 },
] as const;

const weeks = [
 {
 w:"01",
 title:"AI Fundamentals",
 objectives: ["Understand core AI concepts such as machine learning, automated decision systems, generative AI, and data infrastructures.","Understand AI system fundamentals for policy in public services, finance, healthcare, education, and governance.","Analyse the socio-technical nature of AI systems — how human, institutional, and technical elements interact.","Learn AI development lifecycle stages.","Identify AI limitations: bias, hallucinations, explainability.",
 ],
 },
 {
 w:"02",
 title:"Global & African AI Governance Landscape",
 objectives: ["Map global AI governance frameworks (UNESCO, OECD, EU AI Act).","Master AU Continental AI Strategy & Kigali Declaration.","Analyze regional frameworks (ECOWAS, EAC, SADC).",
 ],
 },
 {
 w:"03",
 title:"Ethical Reasoning & African Values",
 objectives: ["Apply Ubuntu philosophy to AI ethics frameworks.","Integrate indigenous knowledge systems in AI governance.","Navigate ethical trade-offs in resource-constrained settings.",
 ],
 },
 {
 w:"04",
 title:"Algorithmic Justice",
 objectives: ["Apply human rights frameworks to AI systems assessment.","Assess algorithmic discrimination risks in African contexts.","Apply fairness metrics and mitigation strategies.","Design rights-based AI governance mechanisms.",
 ],
 },
 {
 w:"05",
 title:"Risk Management & Assessment",
 objectives: ["Apply AI risk classification frameworks.","Conduct systematic AI risk assessments.","Design risk mitigation strategies for African contexts.",
 ],
 },
 {
 w:"06",
 title:"AI Auditing & Monitoring",
 objectives: ["Design AI audit frameworks and protocols.","Develop ongoing monitoring mechanisms.","Create accountability documentation systems.",
 ],
 },
 {
 w:"07",
 title:"Transparency and Explainable AI",
 objectives: ["Explain the concept of black-box models vs interpretable AI systems.","Understand Explainable AI (XAI) approaches.","Design transparency standards for AI deployment.","Evaluate transparency in public/private sector AI procurement.","Promote open governance approaches for AI systems.",
 ],
 },
 {
 w:"08",
 title:"Policy Communication & Stakeholder Engagement",
 objectives: ["Master policy brief writing techniques.","Conduct comprehensive stakeholder mapping.","Translate technical AI concepts for diverse audiences.",
 ],
 },
 {
 w:"09",
 title:"Sector Governance & Capstone Launch",
 objectives: ["Apply WHO health AI ethics guidelines.","Address EdTech governance challenges.","Design sector-specific oversight mechanisms.","Address agricultural AI data sovereignty issues.","Govern fintech & credit scoring AI fairly.","Launch capstone projects with mentor guidance.",
 ],
 },
 {
 w:"10",
 title:"Capstone Development & Stakeholder Consultation",
 objectives: ["Develop capstone project core content.","Conduct real stakeholder consultations.","Integrate feedback and refine methodology.",
 ],
 },
 {
 w:"11",
 title:"Coalition Building & Implementation Planning",
 objectives: ["Design coalition development strategies.","Create actionable implementation roadmaps.","Build consensus mechanisms for AI governance.",
 ],
 },
 {
 w:"12",
 title:"Graduation & AI Summit Showcase",
 objectives: ["Present capstone projects to expert panels.","Launch Africa AI Ethics & Governance Network.","Showcase outputs at AI Summit sessions.",
 ],
 },
];

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
 <Link href="/" className="inline-flex items-center gap-2">
 {/* Two logo variants for two header states:
     - over the navy hero (transparent header) → `logo.png`,
       white-text-on-transparent
     - over the scrolled white header → `white-logo.png`,
       designed for light backgrounds
     Swapping src is cheaper than wrapping in a contrast pill,
     and keeps the logo at its native colour in both states. */}
 <Image
 src={scrolled ?"/images/white-logo.png":"/images/logo.png"} alt="Africa Hub for Innovation & Development" width={160}
 height={48}
 className="h-10 w-auto" priority
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
 Shaping the future of{" "}
 <span className="text-pic-yellow">responsible AI</span> in Africa.
 </h1>
 <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
 The AI Ethics &amp; Governance Fellowship equips a new generation
 of African leaders with the knowledge, frameworks, and networks
 needed to design ethical and accountable AI governance systems.
 </p>
 <div className="mt-8 flex flex-wrap gap-3">
 <Link
 href="/signin#register" className="inline-flex items-center gap-2 rounded-lg bg-pic-yellow px-6 py-3 text-base font-semibold text-fellowship-navy shadow-theme-sm transition hover:bg-pic-yellow-hover">
 Become a Fellow
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

 {/* INTRO */}
 <section className="mx-auto grid max-w-(--breakpoint-content) gap-10 px-6 lg:px-12 xl:px-16 py-20 md:grid-cols-12 md:py-28">
 <div className="md:col-span-5">
 <h2 className="text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
 Africa is writing
 <br />
 the rules for AI.
 </h2>
 </div>
 <div className="space-y-5 text-base leading-relaxed text-gray-600 md:col-span-7 md:text-lg">
 <p>
 Artificial Intelligence is rapidly reshaping economies, governance,
 and social systems across Africa. Yet the frameworks that will
 determine how AI is deployed, regulated, and held accountable are
 still being written.
 </p>
 <p>
 Delivered by the{" "}
 <strong className="text-gray-900">
 Policy Innovation Centre (PIC)
 </strong>{" "}
 in partnership with{" "}
 <strong className="text-gray-900">
 Africa Hub For Innovation &amp; Development (AHFID)
 </strong>{" "}
 and support from{" "}
 <strong className="text-gray-900">Luminate</strong>
 , this program brings together policy professionals, regulators,
 researchers, and civil society leaders.
 </p>
 <p>
 Rather than importing governance models developed elsewhere, the
 fellowship centres African ethical traditions, local institutional
 realities, and community perspectives — including principles such as{" "}
 <em>Ubuntu</em> and collective responsibility in technology
 governance.
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
 Built for impact, designed for African contexts.
 </h2>
 </div>
 <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
 {features.map(({ Icon, title, body }) => (
 <article
 key={title}
 className="group rounded-2xl border border-gray-200 bg-white p-7 transition hover:shadow-theme-lg">
 <div className="flex h-11 w-11 items-center justify-center rounded-md bg-pic-yellow text-fellowship-navy transition group-hover:bg-fellowship-navy group-hover:text-pic-yellow">
 <Icon className="h-5 w-5"/>
 </div>
 <h3 className="mt-5 text-lg font-bold leading-snug text-gray-900">
 {title}
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-gray-600">
 {body}
 </p>
 </article>
 ))}
 </div>
 </div>
 </section>

 {/* CURRICULUM */}
 <section
 id="curriculum" className="mx-auto max-w-(--breakpoint-content) px-6 lg:px-12 xl:px-16 py-20 md:py-28">
 <div className="mx-auto max-w-5xl">
 <div className="mb-12 max-w-3xl">
 <span className="text-xs font-semibold uppercase tracking-wider text-fellowship-navy">
 12-Week Curriculum
 </span>
 <h2 className="mt-2 text-3xl font-bold text-gray-900 md:text-5xl">
 From foundations to governance artefacts.
 </h2>
 <p className="mt-5 text-base leading-relaxed text-gray-600 md:text-lg">
 Move from foundational understanding to producing real governance
 artefacts: policy frameworks, AI audit protocols, sector-specific
 safeguards, and accountability mechanisms.
 </p>
 </div>

 <Accordion>
 {weeks.map((wk) => (
 <AccordionItem key={wk.w} value={wk.w}>
 <AccordionTrigger>
 <div className="grid w-full grid-cols-12 items-center gap-4 pr-4">
 <div className="col-span-3 md:col-span-2">
 <div className="w-fit overflow-hidden rounded-md border border-gray-300 bg-gray-100">
 <div className="flex items-center justify-center gap-1 bg-gray-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
 <CalenderIcon className="h-2.5 w-2.5"/>
 WEEK
 </div>
 <div className="px-3 py-2 text-center">
 <div className="text-2xl font-bold leading-none text-gray-800 md:text-3xl">
 {wk.w}
 </div>
 </div>
 </div>
 </div>
 <div className="col-span-9 text-left text-lg font-semibold md:col-span-10 md:text-xl">
 {wk.title}
 </div>
 </div>
 </AccordionTrigger>
 <AccordionContent>
 <div className="grid grid-cols-12 gap-4">
 <div className="col-span-3 md:col-span-2"/>
 <div className="col-span-9 pb-2 md:col-span-10">
 <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
 Learning Objectives
 </div>
 <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-600">
 {wk.objectives.map((o, i) => (
 <li key={i}>{o}</li>
 ))}
 </ul>
 </div>
 </div>
 </AccordionContent>
 </AccordionItem>
 ))}
 </Accordion>
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
 Start your application
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
 {cohortIsFull ? "Join the Waitlist" : "Join the Next Cohort"}
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

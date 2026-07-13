import React from "react";
import Link from "next/link";
import type { CurrentUser } from "@/lib/auth/useCurrentUser";
import type { AttentionItem } from "@/lib/api/dashboard";

type WelcomePanelProps = {
 user: CurrentUser;
 cohortName: string;
 currentWeek: number;
 weekCount: number;
 attentionItems: AttentionItem[];
};

export default function WelcomePanel({
 user,
 cohortName,
 currentWeek,
 weekCount,
 attentionItems,
}: WelcomePanelProps) {
 const firstName = user.fullName.split(" ")[0];
 const greeting = greetingForHour(new Date().getHours());
 const urgent = attentionItems.filter((i) => i.intent ==="urgent").slice(0, 2);

 return (
 <header className="flex flex-col gap-1">
 <h1 className="text-title-md font-bold text-gray-900">
 {greeting}, {firstName}.
 </h1>
 <p className="text-base text-gray-500">
 {cohortName} is in week {currentWeek}
 {weekCount > 0 ? ` of ${weekCount}` : ""}.
 {urgent.length > 0 && (
 <>
 {" "}
 {urgent.map((item, idx) => (
 <React.Fragment key={item.id}>
 <Link
 href={item.href}
 className="font-semibold text-fellowship-navy underline decoration-fellowship-navy/30 underline-offset-4 hover:decoration-fellowship-navy">
 {item.count} {item.label.toLowerCase()}
 </Link>
 {idx === 0 && urgent.length > 1 && "and " }
 {idx === urgent.length - 1 && "need your attention. " }
 </React.Fragment>
 ))}
 </>
 )}
 </p>
 </header>
 );
}

function greetingForHour(hour: number): string {
 if (hour < 5) return "Hi";
 if (hour < 12) return "Good morning";
 if (hour < 17) return "Good afternoon";
 if (hour < 22) return "Good evening";
 return "Hi";
}

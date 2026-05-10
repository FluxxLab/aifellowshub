import type { Metadata } from "next";
import AiBuddyChat from "@/components/fellow/AiBuddyChat";
import AiBuddyTour from "@/components/fellow/tours/AiBuddyTour";

export const metadata: Metadata = {
  title: "AI Buddy · AI Fellows LMS",
  description:
    "Your study companion. Ask questions about the curriculum, work through assessment prep, or explore ideas for your capstone (BRD §6.7).",
};

export default function AiBuddyPage() {
  return (
    <>
      <AiBuddyTour />
      <AiBuddyChat />
    </>
  );
}

import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SurveyResponsesView from "@/components/admin/survey-responses/SurveyResponsesView";
import {
  listEndOfProgrammeSurveyResponsesServer,
  listSurveyResponsesServer,
} from "@/lib/api/survey-responses.server";

export const metadata: Metadata = {
  title: "Survey responses · AI Fellows LMS",
  description:
    "Week 1 baseline and Week 9 end-of-programme survey responses submitted by fellows.",
};

export const dynamic = "force-dynamic";

export default async function SurveyResponsesPage() {
  // Same question set, two separate response sets — fetched independently and
  // shown under their own tabs so baseline and endline are never conflated.
  const [responses, endlineResponses] = await Promise.all([
    listSurveyResponsesServer(),
    listEndOfProgrammeSurveyResponsesServer(),
  ]);
  return (
    <>
      <PageBreadcrumb pageTitle="Survey responses" />
      <SurveyResponsesView
        responses={responses}
        endlineResponses={endlineResponses}
      />
    </>
  );
}

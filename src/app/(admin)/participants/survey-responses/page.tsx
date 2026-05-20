import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SurveyResponsesView from "@/components/admin/survey-responses/SurveyResponsesView";
import { listSurveyResponsesServer } from "@/lib/api/survey-responses.server";

export const metadata: Metadata = {
  title: "Survey responses · AI Fellows LMS",
  description: "Pre-fellowship survey responses submitted by fellows.",
};

export const dynamic = "force-dynamic";

export default async function SurveyResponsesPage() {
  const responses = await listSurveyResponsesServer();
  return (
    <>
      <PageBreadcrumb pageTitle="Survey responses" />
      <SurveyResponsesView responses={responses} />
    </>
  );
}

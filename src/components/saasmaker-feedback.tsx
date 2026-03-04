"use client";

import { FeedbackWidget } from "@saas-maker/feedback";
import "@saas-maker/feedback/dist/index.css";

export function SaaSMakerFeedback() {
  const apiKey = process.env.NEXT_PUBLIC_SAASMAKER_API_KEY;
  if (!apiKey) return null;
  return (
    <FeedbackWidget
      projectId={apiKey}
      apiBaseUrl="https://api.sassmaker.com"
      position="bottom-right"
      theme="auto"
    />
  );
}

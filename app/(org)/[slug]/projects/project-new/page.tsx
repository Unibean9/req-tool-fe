"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";
import { useCreateOrgProject } from "@/hooks/useProject";

import { resolveWizardExitHref } from "@/app/(org)/components/orgWorkspacePaths";

import { useOrgWorkspace } from "../../orgWorkspaceContext";
import { ProjectNewFooter } from "./components/projectNewFooter";
import { ProjectNewPageToolbar } from "./components/projectNewPageToolbar";
import { PROJECT_NEW_TOTAL_STEPS } from "./components/projectNewSteps";
import {
  isProjectNewFormValid,
  isProjectNewStepValid,
  validateProjectNewStep,
} from "./components/projectNewFormSchema";
import { ProjectNewStepBasics } from "./components/steps/projectNewStepBasics";

function emptyCreateProjectForm(): CreateOrgProjectRequest {
  return {
    name: "",
    description: "",
  };
}

function OrgProjectNewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orgId, slug } = useOrgWorkspace();
  const encSlug = encodeURIComponent(slug);
  const projectsBase = `/${encSlug}/projects`;
  const exitHref = resolveWizardExitHref(
    slug,
    searchParams.get("returnTo"),
    projectsBase
  );

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateOrgProjectRequest>(emptyCreateProjectForm);
  const [showSubmitErrors, setShowSubmitErrors] = useState(false);

  const stepErrors = useMemo(
    () => validateProjectNewStep(step, form).errors,
    [step, form]
  );

  const createProject = useCreateOrgProject({
    onSuccess: (res) => {
      router.push(
        `${projectsBase}/${encodeURIComponent(res.data.slug)}/dashboard`
      );
    },
  });

  const patchForm = useCallback((patch: Partial<CreateOrgProjectRequest>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const exitWizard = useCallback(() => {
    router.replace(exitHref);
  }, [router, exitHref]);

  const isLast = step === PROJECT_NEW_TOTAL_STEPS - 1;
  const stepValid = isProjectNewStepValid(step, form);
  const formValid = isProjectNewFormValid(form);
  const nextDisabled = isLast
    ? !formValid || createProject.isPending
    : !stepValid || createProject.isPending;

  const handleNext = () => {
    const validation = validateProjectNewStep(step, form);
    if (!validation.success) {
      setShowSubmitErrors(true);
      return;
    }
    if (isLast) {
      if (!formValid || createProject.isPending) return;
      createProject.mutate({ orgId, body: form });
      return;
    }
    setShowSubmitErrors(false);
    setStep((s) => Math.min(PROJECT_NEW_TOTAL_STEPS - 1, s + 1));
  };

  const handleBack = () => {
    setShowSubmitErrors(false);
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ProjectNewPageToolbar
          currentStepIndex={step}
          onExit={exitWizard}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 sm:px-8 sm:pb-5 lg:px-10 lg:pb-6">
          <div className="mx-auto w-full max-w-2xl py-6">
            <ProjectNewStepBasics
              form={form}
              onPatch={patchForm}
              disabled={createProject.isPending}
              showSubmitErrors={showSubmitErrors}
              errors={stepErrors}
            />
          </div>
        </div>

        <ProjectNewFooter
          currentStepIndex={step}
          totalSteps={PROJECT_NEW_TOTAL_STEPS}
          canGoBack={step > 0}
          onBack={handleBack}
          isLastStep={isLast}
          nextDisabled={nextDisabled}
          nextLoading={createProject.isPending}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}

export default function OrgProjectNewPage() {
  return (
    <Suspense fallback={null}>
      <OrgProjectNewPageContent />
    </Suspense>
  );
}

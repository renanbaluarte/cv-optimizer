"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAnalysisAction } from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";

type Props = { id: string; dict: Dictionary; redirectTo?: string };

export function DeleteAnalysisButton({ id, dict, redirectTo }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(dict.delete.confirm)) return;
    startTransition(async () => {
      const result = await deleteAnalysisAction(id);
      if (!result.ok) alert(dict.errors[result.error]);
      else if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className={`button is-small is-ghost has-text-danger ${isPending ? "is-loading" : ""}`}
    >
      {dict.delete.label}
    </button>
  );
}

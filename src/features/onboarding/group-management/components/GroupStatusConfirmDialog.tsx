"use client";

import { CheckCircle2, Ban, ShieldAlert, XCircle } from "lucide-react";
import { ConfirmDialog, type ConfirmVariant } from "@/components/shared/ConfirmDialog";
import type { Group, GroupStatus } from "../types/group.types";

export type GroupStatusConfirmDialogProps = {
  group: Group | null;
  targetStatus: GroupStatus | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export function GroupStatusConfirmDialog({
  group,
  targetStatus,
  onClose,
  onConfirm,
}: GroupStatusConfirmDialogProps) {
  if (!group || targetStatus == null) return null;

  let title = "Change Group Status";
  let description = `Are you sure you want to change the status of "${group.groupName}"?`;
  let variant: ConfirmVariant = "warning";
  let confirmLabel = "Confirm";
  let icon = Ban;

  if (targetStatus === 1) {
    const isReopen = group.statusCd === 4;
    title = isReopen ? "Re-open Group" : "Activate Group";
    description = isReopen
      ? `Re-open "${group.groupName}"? It will become active and available for customer onboarding.`
      : `Activate "${group.groupName}"? It will be available for meetings and new member onboarding.`;
    variant = "success";
    confirmLabel = isReopen ? "Re-open Group" : "Activate Group";
    icon = CheckCircle2;
  } else if (targetStatus === 2) {
    title = "Deactivate Group";
    description = `Deactivate "${group.groupName}"? It will be hidden from new onboarding and loan applications.`;
    variant = "warning";
    confirmLabel = "Deactivate";
    icon = Ban;
  } else if (targetStatus === 3) {
    title = "Suspend Group";
    description = `Suspend "${group.groupName}"? Use this for temporary holds (e.g. defaults, disputes).`;
    variant = "warning";
    confirmLabel = "Suspend";
    icon = ShieldAlert;
  } else if (targetStatus === 4) {
    title = "Close Group";
    description = `Close "${group.groupName}"? A closed group cannot be edited.`;
    variant = "danger";
    confirmLabel = "Close Group";
    icon = XCircle;
  }

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      actionType="custom"
      variant={variant}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      icon={icon}
      itemName={group.groupName}
      itemType="Group"
    />
  );
}

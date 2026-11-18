"use client";

import { CheckCircle2, Ban, ShieldAlert, XCircle, UserX } from "lucide-react";
import { ConfirmDialog, type ConfirmVariant } from "@/components/shared/ConfirmDialog";
import type { Member, MemberStatus } from "../types/member.types";

export type MemberStatusConfirmDialogProps = {
  member: Member | null;
  targetStatus: MemberStatus | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export function MemberStatusConfirmDialog({
  member,
  targetStatus,
  onClose,
  onConfirm,
}: MemberStatusConfirmDialogProps) {
  if (!member || targetStatus == null) return null;

  let title = "Change Member Status";
  let description = `Are you sure you want to change the status of "${member.memberName}"?`;
  let variant: ConfirmVariant = "warning";
  let confirmLabel = "Confirm";
  let icon = Ban;

  if (targetStatus === 1) {
    title = "Activate Member";
    description = `Activate "${member.memberName}"? The member will become active and eligible for group participation and loans. Note: The member's branch and center must be active.`;
    variant = "success";
    confirmLabel = "Activate Member";
    icon = CheckCircle2;
  } else if (targetStatus === 2) {
    title = "Deactivate Member";
    description = `Deactivate "${member.memberName}"? The member will be temporarily inactive.`;
    variant = "warning";
    confirmLabel = "Deactivate";
    icon = Ban;
  } else if (targetStatus === 3) {
    title = "Suspend Member";
    description = `Suspend "${member.memberName}"? Use this for temporary holds (e.g. disputes, audits, or default).`;
    variant = "warning";
    confirmLabel = "Suspend Member";
    icon = ShieldAlert;
  } else if (targetStatus === 4) {
    title = "Close Membership";
    description = `Close membership for "${member.memberName}"? Note: The member must not belong to any active group. Closed members cannot be edited.`;
    variant = "danger";
    confirmLabel = "Close Membership";
    icon = XCircle;
  } else if (targetStatus === 5) {
    title = "Mark Member as Deceased";
    description = `Mark "${member.memberName}" as deceased? This record will be archived and cannot be edited.`;
    variant = "danger";
    confirmLabel = "Mark Deceased";
    icon = UserX;
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
      itemName={member.memberName}
      itemType="Member"
    />
  );
}

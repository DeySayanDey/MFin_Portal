"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/ui/Form";
import { SubscriberPickerModal } from "@/features/onboarding/share-subscription/components/SubscriberPickerModal";
import { CUST_TYPE_GROUP, CUST_TYPE_INDIVIDUAL } from "@/features/onboarding/share-subscription/share-subscription.constants";

export function MemberNumberField({ value, onChange, onSelect, label = "Member no.", customerType = CUST_TYPE_INDIVIDUAL, required = true, error }: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (member: { code: string; name: string }) => void;
  label?: string;
  customerType?: typeof CUST_TYPE_INDIVIDUAL | typeof CUST_TYPE_GROUP;
  required?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("onboarding.shareSubscription");
  return (
    <>
      <TextField label={label} value={value} onChange={onChange} required={required} error={error} trailing={
        <button type="button" onClick={() => setOpen(true)} aria-label={t(customerType === CUST_TYPE_GROUP ? "picker.titleGroup" : "picker.titleMember")} title={t(customerType === CUST_TYPE_GROUP ? "picker.titleGroup" : "picker.titleMember")} className="rounded-md p-1.5 text-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
      } />
      <SubscriberPickerModal open={open} custTypeCd={customerType} selectedId={null} onClose={() => setOpen(false)} onSelect={(member) => { onSelect(member); setOpen(false); }} />
    </>
  );
}

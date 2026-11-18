"use client";

import { SmsSettingsForm } from "@/features/master/sms-settings";
import { WhatsAppSettingsForm } from "@/features/master/whatsapp-settings";

/**
 * Combined SMS + WhatsApp gateway settings for `/master/gateway`.
 */
export function GatewaySettingsView() {
  return (
    <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
      <SmsSettingsForm />
      <WhatsAppSettingsForm />
    </div>
  );
}

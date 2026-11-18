/**
 * WhatsApp Settings — Laravel WhatsAppSettingsGet / WhatsAppSettingsUpdate.
 */

export type WhatsAppSettingsDto = {
  id: number;
  access_token: string | null;
  pnno_id: string | null;
  waba_id: string | null;
  webhook_url: string | null;
  verify_token: string | null;
  is_default: boolean;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WhatsAppSettings = {
  id: number;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  webhookUrl: string | null;
  verifyToken: string | null;
  isDefault: boolean;
  updatedBy: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type WhatsAppSettingsUpdateInput = {
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  webhookUrl?: string | null;
  verifyToken?: string | null;
  isDefault: boolean;
};

export type WhatsAppSettingsUpdateDto = {
  access_token: string;
  pnno_id: string;
  waba_id: string;
  webhook_url?: string | null;
  verify_token?: string | null;
  is_default: boolean;
};

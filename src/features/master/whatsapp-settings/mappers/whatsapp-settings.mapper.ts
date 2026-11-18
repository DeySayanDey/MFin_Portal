import type {
  WhatsAppSettings,
  WhatsAppSettingsUpdateDto,
  WhatsAppSettingsUpdateInput,
} from "@/features/master/whatsapp-settings/types/whatsapp-settings.types";

export function mapWhatsAppSettingsDto(dto: {
  id: number;
  access_token: string;
  pnno_id: string;
  waba_id: string;
  webhook_url?: string | null;
  verify_token?: string | null;
  is_default: boolean;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}): WhatsAppSettings {
  return {
    id: dto.id,
    accessToken: dto.access_token ?? "",
    phoneNumberId: dto.pnno_id ?? "",
    wabaId: dto.waba_id ?? "",
    webhookUrl: dto.webhook_url ?? null,
    verifyToken: dto.verify_token ?? null,
    isDefault: dto.is_default === true,
    updatedBy: dto.updated_by ?? null,
    createdAt: dto.created_at ?? null,
    updatedAt: dto.updated_at ?? null,
  };
}

export function mapWhatsAppSettingsUpdateToDto(
  input: WhatsAppSettingsUpdateInput,
): WhatsAppSettingsUpdateDto {
  const dto: WhatsAppSettingsUpdateDto = {
    access_token: input.accessToken.trim(),
    pnno_id: input.phoneNumberId.trim(),
    waba_id: input.wabaId.trim(),
    is_default: input.isDefault === true,
  };

  if (input.webhookUrl !== undefined) {
    const trimmed =
      input.webhookUrl == null ? null : input.webhookUrl.trim();
    dto.webhook_url = trimmed === "" ? null : trimmed;
  }

  if (input.verifyToken !== undefined) {
    const trimmed =
      input.verifyToken == null ? null : input.verifyToken.trim();
    dto.verify_token = trimmed === "" ? null : trimmed;
  }

  return dto;
}

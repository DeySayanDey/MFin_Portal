import type {
  SmsSettings,
  SmsSettingsUpdateDto,
  SmsSettingsUpdateInput,
} from "@/features/master/sms-settings/types/sms-settings.types";

export function mapSmsSettingsDto(dto: {
  id: number;
  api_key: string;
  header_key: string;
  user_nm: string;
  user_pwd: string;
  is_default: boolean;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}): SmsSettings {
  return {
    id: dto.id,
    apiKey: dto.api_key,
    headerKey: dto.header_key,
    userName: dto.user_nm,
    userPassword: dto.user_pwd,
    isDefault: dto.is_default === true,
    updatedBy: dto.updated_by ?? null,
    createdAt: dto.created_at ?? null,
    updatedAt: dto.updated_at ?? null,
  };
}

export function mapSmsSettingsUpdateToDto(
  input: SmsSettingsUpdateInput,
): SmsSettingsUpdateDto {
  return {
    api_key: input.apiKey.trim(),
    header_key: input.headerKey.trim(),
    user_nm: input.userName.trim(),
    user_pwd: input.userPassword,
    is_default: input.isDefault === true,
  };
}

/**
 * SMS Settings — Laravel SmsSettingsGet / SmsSettingsUpdate.
 */

/** Laravel response `data`. */
export type SmsSettingsDto = {
  id: number;
  api_key: string;
  header_key: string;
  user_nm: string;
  user_pwd: string;
  is_default: boolean;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/** Frontend domain model. */
export type SmsSettings = {
  id: number;
  apiKey: string;
  headerKey: string;
  userName: string;
  userPassword: string;
  isDefault: boolean;
  updatedBy: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

/** Writable update payload (domain → BFF). */
export type SmsSettingsUpdateInput = {
  apiKey: string;
  headerKey: string;
  userName: string;
  userPassword: string;
  isDefault: boolean;
};

/** Laravel SmsSettingsUpdate request body. */
export type SmsSettingsUpdateDto = {
  api_key: string;
  header_key: string;
  user_nm: string;
  user_pwd: string;
  is_default: boolean;
};

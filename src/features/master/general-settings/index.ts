export { GeneralSettingsView } from "./components/GeneralSettingsView";
export {
  bulkChangeGeneralSettingStatus,
  changeGeneralSettingStatus,
  fetchGeneralSettings,
  isGeneralSettingsClientError,
  type GeneralSettingsClientError,
} from "./services/general-settings-client";
export type {
  GeneralSetting,
  GeneralSettingBulkResult,
  GeneralSettingBulkStatusInput,
  GeneralSettingStatusInput,
} from "./types/general-settings.types";

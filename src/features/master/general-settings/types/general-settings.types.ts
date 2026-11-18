/** One row of `mst_settings_general`. `Status` 1 = active, 0 = inactive. */
export type GeneralSetting = {
  id: number;
  groupNo: number;
  code: string;
  purpose: string;
  isActive: boolean;
};

export type GeneralSettingStatusInput = {
  id: number;
  isActive: boolean;
};

export type GeneralSettingBulkStatusInput = {
  ids: number[];
  isActive: boolean;
};

export type GeneralSettingBulkResult = {
  message: string;
  items: GeneralSetting[];
};

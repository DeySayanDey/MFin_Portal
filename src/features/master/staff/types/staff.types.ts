/**
 * Staff types — documented StaffList / StaffAdd / StaffEdit
 * plus DesignationList / ModuleAccessList dropdowns.
 */

export type StaffModuleAccessDto = {
  module_id: number;
  module_key: string;
  module_label: string;
};

export type StaffModuleAccess = {
  moduleId: number;
  moduleKey: string;
  moduleLabel: string;
};

export type StaffDto = {
  staff_id: number;
  branch_id: number | null;
  employee_code: string;
  employee_ref_code?: string | null;
  full_name: string;
  short_name: string | null;
  designation_id: number | null;
  role_id?: number | null;
  designation_name: string | null;
  mobile: string | null;
  email: string | null;
  join_date: string | null;
  aadhaar: string | null;
  pan: string | null;
  device_id: number | null;
  user_id: number | null;
  user_name?: string | null;
  is_field_staff?: number | boolean | null;
  status: number;
  module_access?: StaffModuleAccessDto[] | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Staff = {
  staffId: number;
  branchId: number | null;
  employeeCode: string;
  employeeRefCode?: string | null;
  fullName: string;
  shortName: string | null;
  designationId: number | null;
  roleId?: number | null;
  designationName: string | null;
  mobile: string | null;
  email: string | null;
  joinDate: string | null;
  aadhaar: string | null;
  pan: string | null;
  deviceId: number | null;
  userId: number | null;
  userName?: string | null;
  isFieldStaff?: boolean;
  status: number;
  moduleAccess: StaffModuleAccess[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type StaffListQuery = {
  page?: number;
  perPage?: number;
  staffId?: number;
  branchId?: number;
  designationId?: number;
  keyword?: string;
  status?: number;
  isFieldStaff?: 0 | 1;
  includeModules?: boolean;
};

export type PaginationMetaDto = {
  total: number;
  page: number;
  per_page: number;
  last_page: number;
  has_more: boolean;
};

export type PaginationMeta = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  hasMore: boolean;
};

export type StaffListResult = {
  items: Staff[];
  meta: PaginationMeta | null;
};

/** Shared writable fields (create + edit). */
export type StaffWritableInput = {
  fullName: string;
  shortName?: string | null;
  employeeCode?: string | null;
  employeeRefCode?: string | null;
  branchId?: number | null;
  designationId?: number | null;
  mobile?: string | null;
  email?: string | null;
  joinDate?: string | null;
  aadhaar?: string | null;
  pan?: string | null;
  deviceId?: number | null;
  status?: number;
};

export type StaffCreateInput = StaffWritableInput & {
  roleId?: number;
  userName?: string;
  userPass: string;
};

export type StaffWritableDto = {
  full_name: string;
  short_name?: string | null;
  employee_code?: string | null;
  employee_ref_code?: string | null;
  branch_id?: number | null;
  designation_id?: number | null;
  mobile?: string | null;
  email?: string | null;
  join_date?: string | null;
  aadhaar?: string | null;
  pan?: string | null;
  device_id?: number | null;
  status?: number;
};

export type StaffCreateDto = StaffWritableDto & {
  role_id?: number;
  user_name?: string;
  user_pass: string;
};

export type StaffUpdateInput = StaffWritableInput & {
  roleId?: number | null;
  userName?: string | null;
  userPass?: string | null;
  staffId: number;
  employeeCode: string;
};

export type StaffUpdateDto = StaffWritableDto & {
  role_id?: number | null;
  user_name?: string;
  user_pass?: string;
  staff_id: number;
  employee_code: string;
};

export type StaffMutationResult = {
  staffId: number;
  employeeCode: string | null;
  userId: number | null;
  userName: string | null;
};

export type DesignationOption = {
  designationId: number;
  designationName: string;
};

export type ModuleAccessOption = {
  moduleId: number;
  moduleKey: string;
  moduleLabel: string;
};

export type StaffLookups = {
  designations: DesignationOption[];
  modules: ModuleAccessOption[];
};

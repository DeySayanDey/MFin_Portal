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
  full_name: string;
  designation_id: number | null;
  designation_name: string | null;
  mobile: string | null;
  email: string | null;
  join_date: string | null;
  aadhaar: string | null;
  pan: string | null;
  monthly_salary: number | null;
  collection_target: number | null;
  assignment: string | null;
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
  fullName: string;
  designationId: number | null;
  designationName: string | null;
  mobile: string | null;
  email: string | null;
  joinDate: string | null;
  aadhaar: string | null;
  pan: string | null;
  monthlySalary: number | null;
  collectionTarget: number | null;
  assignment: string | null;
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

export type StaffCreateInput = {
  fullName: string;
  employeeCode?: string | null;
  branchId?: number | null;
  designationId?: number | null;
  mobile?: string | null;
  email?: string | null;
  joinDate?: string | null;
  aadhaar?: string | null;
  pan?: string | null;
  monthlySalary?: number | null;
  collectionTarget?: number | null;
  assignment?: string | null;
  moduleIds?: number[];
  status?: number;
};

export type StaffCreateDto = {
  full_name: string;
  employee_code?: string | null;
  branch_id?: number | null;
  designation_id?: number | null;
  mobile?: string | null;
  email?: string | null;
  join_date?: string | null;
  aadhaar?: string | null;
  pan?: string | null;
  monthly_salary?: number | null;
  collection_target?: number | null;
  assignment?: string | null;
  module_ids?: number[];
  status?: number;
};

export type StaffUpdateInput = StaffCreateInput & {
  staffId: number;
  employeeCode: string;
};

export type StaffUpdateDto = StaffCreateDto & {
  staff_id: number;
  employee_code: string;
};

export type StaffMutationResult = {
  staffId: number;
  employeeCode: string | null;
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

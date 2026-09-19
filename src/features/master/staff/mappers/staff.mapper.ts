import type {
  DesignationOption,
  ModuleAccessOption,
  PaginationMeta,
  PaginationMetaDto,
  Staff,
  StaffCreateDto,
  StaffCreateInput,
  StaffModuleAccess,
  StaffMutationResult,
  StaffUpdateDto,
  StaffUpdateInput,
} from "@/features/master/staff/types/staff.types";

export function mapStaffModuleAccessDto(dto: {
  module_id: number;
  module_key: string;
  module_label: string;
}): StaffModuleAccess {
  return {
    moduleId: dto.module_id,
    moduleKey: dto.module_key,
    moduleLabel: dto.module_label,
  };
}

export function mapStaffDto(dto: {
  staff_id: number;
  branch_id?: number | null;
  employee_code: string;
  full_name: string;
  designation_id?: number | null;
  designation_name?: string | null;
  mobile?: string | null;
  email?: string | null;
  join_date?: string | null;
  aadhaar?: string | null;
  pan?: string | null;
  monthly_salary?: number | null;
  collection_target?: number | null;
  assignment?: string | null;
  status: number;
  module_access?:
    | {
        module_id: number;
        module_key: string;
        module_label: string;
      }[]
    | null;
  created_at?: string | null;
  updated_at?: string | null;
}): Staff {
  return {
    staffId: dto.staff_id,
    branchId: dto.branch_id ?? null,
    employeeCode: dto.employee_code,
    fullName: dto.full_name,
    designationId: dto.designation_id ?? null,
    designationName: dto.designation_name ?? null,
    mobile: dto.mobile ?? null,
    email: dto.email ?? null,
    joinDate: dto.join_date ?? null,
    aadhaar: dto.aadhaar ?? null,
    pan: dto.pan ?? null,
    monthlySalary: dto.monthly_salary ?? null,
    collectionTarget: dto.collection_target ?? null,
    assignment: dto.assignment ?? null,
    status: dto.status,
    moduleAccess: (dto.module_access ?? []).map(mapStaffModuleAccessDto),
    createdAt: dto.created_at ?? null,
    updatedAt: dto.updated_at ?? null,
  };
}

function emptyToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return value;
}

function mapWritable(input: StaffCreateInput): StaffCreateDto {
  const dto: StaffCreateDto = {
    full_name: input.fullName,
  };
  if (input.employeeCode !== undefined) {
    dto.employee_code = emptyToNull(input.employeeCode);
  }
  if (input.branchId !== undefined) dto.branch_id = input.branchId;
  if (input.designationId !== undefined) {
    dto.designation_id = input.designationId;
  }
  if (input.mobile !== undefined) dto.mobile = emptyToNull(input.mobile);
  if (input.email !== undefined) dto.email = emptyToNull(input.email);
  if (input.joinDate !== undefined) dto.join_date = emptyToNull(input.joinDate);
  if (input.aadhaar !== undefined) dto.aadhaar = emptyToNull(input.aadhaar);
  if (input.pan !== undefined) dto.pan = emptyToNull(input.pan);
  if (input.monthlySalary !== undefined) {
    dto.monthly_salary = input.monthlySalary;
  }
  if (input.collectionTarget !== undefined) {
    dto.collection_target = input.collectionTarget;
  }
  if (input.assignment !== undefined) {
    dto.assignment = emptyToNull(input.assignment);
  }
  if (input.moduleIds !== undefined) dto.module_ids = input.moduleIds;
  if (input.status !== undefined) dto.status = input.status;
  return dto;
}

export function mapStaffCreateToDto(input: StaffCreateInput): StaffCreateDto {
  return mapWritable(input);
}

export function mapStaffUpdateToDto(input: StaffUpdateInput): StaffUpdateDto {
  return {
    ...mapWritable(input),
    staff_id: input.staffId,
    employee_code: input.employeeCode,
  };
}

export function mapStaffMutationResult(dto: {
  staff_id: number;
  employee_code?: string | null;
}): StaffMutationResult {
  return {
    staffId: dto.staff_id,
    employeeCode: dto.employee_code ?? null,
  };
}

export function mapPaginationMetaDto(dto: PaginationMetaDto): PaginationMeta {
  return {
    total: dto.total,
    page: dto.page,
    perPage: dto.per_page,
    lastPage: dto.last_page,
    hasMore: dto.has_more,
  };
}

export function mapDesignationDto(dto: {
  designation_id: number;
  designation_name: string;
}): DesignationOption {
  return {
    designationId: dto.designation_id,
    designationName: dto.designation_name,
  };
}

export function mapModuleAccessDto(dto: {
  module_id: number;
  module_key: string;
  module_label: string;
}): ModuleAccessOption {
  return {
    moduleId: dto.module_id,
    moduleKey: dto.module_key,
    moduleLabel: dto.module_label,
  };
}

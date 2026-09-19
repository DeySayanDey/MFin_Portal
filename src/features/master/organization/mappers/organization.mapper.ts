import type {
  Organization,
  OrganizationUpdateDto,
  OrganizationUpdateInput,
  PaginationMeta,
  PaginationMetaDto,
  State,
  StateDto,
} from "@/features/master/organization/types/organization.types";

function nullableString(
  value: string | null | undefined,
): string | null {
  if (value === undefined || value === null) return null;
  return value;
}

export function mapOrganizationDto(dto: {
  org_id: number;
  org_disp_nm: string;
  legal_name?: string | null;
  regd_address?: string | null;
  ho_address?: string | null;
  state_cd?: number | null;
  state_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  cin_no?: string | null;
  regd_no?: string | null;
  gst_no?: string | null;
  pan_no?: string | null;
  tan_no?: string | null;
  org_logo?: string | null;
  org_schema: string;
  is_active: boolean;
}): Organization {
  return {
    orgId: dto.org_id,
    orgDispNm: dto.org_disp_nm,
    legalName: nullableString(dto.legal_name),
    regdAddress: nullableString(dto.regd_address),
    hoAddress: nullableString(dto.ho_address),
    stateCd: dto.state_cd ?? null,
    stateName: nullableString(dto.state_name),
    phone: nullableString(dto.phone),
    email: nullableString(dto.email),
    website: nullableString(dto.website),
    cinNo: nullableString(dto.cin_no),
    regdNo: nullableString(dto.regd_no),
    gstNo: nullableString(dto.gst_no),
    panNo: nullableString(dto.pan_no),
    tanNo: nullableString(dto.tan_no),
    orgLogo: nullableString(dto.org_logo),
    orgSchema: dto.org_schema,
    isActive: dto.is_active,
  };
}

export function mapOrganizationUpdateToDto(
  input: OrganizationUpdateInput,
): OrganizationUpdateDto {
  const dto: OrganizationUpdateDto = {
    org_disp_nm: input.orgDispNm,
  };

  if (input.legalName !== undefined) dto.legal_name = input.legalName;
  if (input.regdAddress !== undefined) dto.regd_address = input.regdAddress;
  if (input.hoAddress !== undefined) dto.ho_address = input.hoAddress;
  if (input.stateCd !== undefined) dto.state_cd = input.stateCd;
  if (input.phone !== undefined) dto.phone = input.phone;
  if (input.email !== undefined) {
    dto.email =
      input.email === null || input.email === "" ? input.email : input.email;
  }
  if (input.website !== undefined) dto.website = input.website;
  if (input.cinNo !== undefined) dto.cin_no = input.cinNo;
  if (input.regdNo !== undefined) dto.regd_no = input.regdNo;
  if (input.gstNo !== undefined) dto.gst_no = input.gstNo;
  if (input.panNo !== undefined) dto.pan_no = input.panNo;
  if (input.tanNo !== undefined) dto.tan_no = input.tanNo;
  if (input.isActive !== undefined) dto.is_active = input.isActive;

  // Logo: omit = keep; "" = clear; base64 = set. Never send null.
  if (input.orgLogo !== undefined && input.orgLogo !== null) {
    dto.org_logo = input.orgLogo;
  }

  return dto;
}

export function mapStateDto(dto: StateDto): State {
  return {
    stateCd: dto.state_cd,
    stateName: dto.state_name,
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

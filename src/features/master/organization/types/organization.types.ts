/**
 * Organization + StateList types.
 * DTO fields match apilist.txt only. Domain models use camelCase.
 */

/** Laravel OrgGet / OrgUpdate response `data` object. */
export type OrganizationDto = {
  org_id: number;
  org_disp_nm: string;
  legal_name: string | null;
  regd_address: string | null;
  ho_address: string | null;
  state_cd: number | null;
  state_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  cin_no: string | null;
  regd_no: string | null;
  gst_no: string | null;
  pan_no: string | null;
  tan_no: string | null;
  org_logo: string | null;
  org_schema: string;
  is_active: boolean;
};

/** Frontend organization domain model. */
export type Organization = {
  orgId: number;
  orgDispNm: string;
  legalName: string | null;
  regdAddress: string | null;
  hoAddress: string | null;
  stateCd: number | null;
  stateName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  cinNo: string | null;
  regdNo: string | null;
  gstNo: string | null;
  panNo: string | null;
  tanNo: string | null;
  orgLogo: string | null;
  orgSchema: string;
  isActive: boolean;
};

/**
 * Writable update payload (domain).
 * `orgLogo`:
 * - `undefined` → omit (keep existing)
 * - `""` → clear
 * - non-empty string → set base64
 */
export type OrganizationUpdateInput = {
  orgDispNm: string;
  legalName?: string | null;
  regdAddress?: string | null;
  hoAddress?: string | null;
  stateCd?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  cinNo?: string | null;
  regdNo?: string | null;
  gstNo?: string | null;
  panNo?: string | null;
  tanNo?: string | null;
  orgLogo?: string | null;
  isActive?: boolean;
};

/** Laravel OrgUpdate request body (snake_case). */
export type OrganizationUpdateDto = {
  org_disp_nm: string;
  legal_name?: string | null;
  regd_address?: string | null;
  ho_address?: string | null;
  state_cd?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  cin_no?: string | null;
  regd_no?: string | null;
  gst_no?: string | null;
  pan_no?: string | null;
  tan_no?: string | null;
  org_logo?: string;
  is_active?: boolean;
};

/** Laravel StateList item. */
export type StateDto = {
  state_cd: number;
  state_name: string;
};

export type State = {
  stateCd: number;
  stateName: string;
};

/** Laravel pagination meta (documented). */
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

export type StateListQuery = {
  page?: number;
  perPage?: number;
  stateCd?: number;
  keyword?: string;
};

export type StateListResult = {
  items: State[];
  meta: PaginationMeta | null;
};

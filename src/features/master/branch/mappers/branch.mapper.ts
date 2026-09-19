import type {
  Branch,
  BranchCreateDto,
  BranchCreateInput,
  BranchMutationResult,
  BranchUpdateDto,
  BranchUpdateInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/branch/types/branch.types";

export function mapBranchDto(dto: {
  branch_id: number;
  org_id: number;
  branch_code: string;
  branch_name: string;
  branch_address?: string | null;
  branch_mobile?: string | null;
  branch_mail?: string | null;
  header_text?: string | null;
  is_head: boolean;
  is_active: boolean;
}): Branch {
  return {
    branchId: dto.branch_id,
    orgId: dto.org_id,
    branchCode: dto.branch_code,
    branchName: dto.branch_name,
    branchAddress: dto.branch_address ?? null,
    branchMobile: dto.branch_mobile ?? null,
    branchMail: dto.branch_mail ?? null,
    headerText: dto.header_text ?? null,
    isHead: dto.is_head,
    isActive: dto.is_active,
  };
}

function mapWritable(input: BranchCreateInput): BranchCreateDto {
  const dto: BranchCreateDto = {
    branch_name: input.branchName,
  };
  if (input.branchCode !== undefined && input.branchCode !== null && input.branchCode !== "") {
    dto.branch_code = input.branchCode;
  }
  if (input.branchAddress !== undefined) {
    dto.branch_address = input.branchAddress || null;
  }
  if (input.branchMobile !== undefined) {
    dto.branch_mobile = input.branchMobile || null;
  }
  if (input.branchMail !== undefined) {
    dto.branch_mail = input.branchMail || null;
  }
  if (input.headerText !== undefined) {
    dto.header_text = input.headerText || null;
  }
  if (input.isHead !== undefined) dto.is_head = input.isHead;
  if (input.isActive !== undefined) dto.is_active = input.isActive;
  return dto;
}

export function mapBranchCreateToDto(input: BranchCreateInput): BranchCreateDto {
  return mapWritable(input);
}

export function mapBranchUpdateToDto(input: BranchUpdateInput): BranchUpdateDto {
  return {
    ...mapWritable(input),
    branch_id: input.branchId,
    branch_code: input.branchCode,
  };
}

export function mapBranchMutationResult(dto: {
  branch_id: number;
}): BranchMutationResult {
  return { branchId: dto.branch_id };
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

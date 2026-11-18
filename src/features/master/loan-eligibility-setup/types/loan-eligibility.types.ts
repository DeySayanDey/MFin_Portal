export type LoanEligibilityParameter = {
  paramId: number;
  parameterName: string;
  dataType: string;
  operator: string;
  reqValue: number | null;
  valueCd: number | null;
  valueDesc: string;
  parameterValue: string;
  isMandatory: boolean;
  isActive: boolean;
  effectiveFrom: string | null;
  createdBy: number | null;
  createdAt: string | null;
};

export type LoanEligibilitySaveInput = {
  paramId: number;
  dataType: string;
  operator: string;
  reqValue?: number | null;
  valueCd?: number | null;
  parameterValue?: string | null;
  isMandatory?: boolean;
  effectiveFrom?: string | null;
  isActive?: boolean;
};

export type LoanEligibilityListQuery = {
  page?: number;
  perPage?: number;
  paramId?: number;
  search?: string;
  dataType?: string;
  isMandatory?: number;
  isActive?: number;
};

export type PaginationMeta = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  hasMore?: boolean;
};

export type LoanEligibilityListResult = {
  items: LoanEligibilityParameter[];
  meta: PaginationMeta | null;
};

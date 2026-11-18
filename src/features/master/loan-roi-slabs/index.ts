export { LoanRoiSlabsView } from "./components/LoanRoiSlabsView";
export {
  fetchLoanSchemeSlabs,
  saveLoanSchemeSlab,
  toggleLoanSchemeSlabStatus,
  isLoanRoiSlabsClientError,
  type LoanRoiSlabsClientError,
} from "./services/loan-roi-slabs-client";
export type {
  LoanSchemeSlab,
  LoanSchemeSlabSaveInput,
  LoanSchemeSlabListQuery,
  LoanSchemeSlabListResult,
  LoanSchemeChoice,
} from "./types/loan-roi-slabs.types";

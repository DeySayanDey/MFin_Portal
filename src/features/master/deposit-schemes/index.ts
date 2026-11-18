export { DepositSchemesView } from "./components/DepositSchemesView";
export {
  fetchDepositSchemeSetups,
  saveDepositSchemeSetup,
  toggleDepositSchemeStatus,
  isDepositSchemesClientError,
  type DepositSchemesClientError,
} from "./services/deposit-schemes-client";
export type {
  DepositSchemeSetup,
  DepositSchemeSetupSaveInput,
  DepositSchemeListQuery,
  DepositSchemeListResult,
  DepositSchemeCharge,
  DepositSchemeChargeSaveInput,
} from "./types/deposit-schemes.types";

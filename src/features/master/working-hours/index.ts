export { WorkingHoursForm } from "./components/WorkingHoursForm";
export {
  fetchWorkingHours,
  saveWorkingHours,
  isWorkingHoursClientError,
} from "./services/working-hours-client";
export type {
  WorkingHours,
  WorkingHoursDto,
  WorkingHoursUpdateInput,
} from "./types/working-hours.types";

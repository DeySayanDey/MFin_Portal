"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Save } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CheckboxField,
  DateField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/Form";
import { fetchApplOptions, type ApplOption } from "@/features/master/appl-options";
import { DepositAccountCustomerPicker } from "./DepositAccountCustomerPicker";
import {
  DepositAccountNomineeStep,
  RegisteredNomineeList,
} from "./DepositAccountNomineeStep";
import { DepositAccountSignatoryStep } from "./DepositAccountSignatoryStep";
import { DepositAccountSummaryStep } from "./DepositAccountSummaryStep";
import { fetchMemberNominees, isMemberClientError } from "@/features/onboarding/member-registration/services/member-client";
import { fetchStaffList } from "@/features/master/staff/services/staff-client";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import type { Branch } from "@/features/master/branch/types/branch.types";
import {
  CUST_TYPE_GROUP,
  CUST_TYPE_INDIVIDUAL,
  OPT_CUST_TYPE,
  OPT_MATURITY_INSTRUCTION,
  OPT_OP_MODE,
  OPT_PAYMENT_MODE,
  OPT_STATUS,
  OP_MODE_SIGNATORY,
  OPT_SPECIAL,
  PAYMENT_MODE_CASH,
  SAVINGS_DEPOSIT_TYPE,
  SPECIAL_NORMAL,
  SPECIAL_SENIOR,
  STATUS_ACTIVE,
  STATUS_KYC_PENDING,
  TERM_DEPOSIT_TYPE,
} from "../deposit-account.constants";
import {
  emptyTermDraft,
  needsSbCredit,
  takesInstallments,
  termIssues,
  toTermInput,
  type TermDraft,
  type TermIssue,
} from "../term-draft";
import { DepositAccountTermDetails } from "./DepositAccountTermDetails";
import {
  accountFieldsLocked,
  ageOn,
  custTypeForProduct,
  holderPreview,
  parseYmd,
  isOpModeAllowed,
  isSpecialAllowed,
  jointVisibility,
  mapApiMessageToField,
  savingsFieldsLocked,
  todayYmd,
  toCreateInput,
  toEditInput,
} from "../deposit-account.rules";
import {
  OPT_RELATION,
  RELATION_SELF,
  nomineeAge,
  nomineeErrorTarget,
  draftFromNominee,
  nomineeIssues,
  toNomineeSave,
  type NomineeDraft,
} from "../nominee-draft";
import {
  fetchDepositAccounts,
  fetchDepositNominees,
  fetchDepositProducts,
  fetchDepositSignatories,
} from "../services/deposit-account-client";
import {
  draftFromSignatory,
  signatoryErrorTarget,
  signatoryIssues,
  signatoryPickerMode,
  toSignatorySave,
  type SignatoryDraft,
} from "../signatory-draft";
import type {
  DepositAccount,
  DepositAccountCreateInput,
  DepositAccountEditInput,
  DepositCustomer,
  DepositNominee,
  DepositNomineeSave,
  DepositProductScheme,
  DepositProductType,
  DepositSignatorySave,
} from "../types/deposit-account.types";

type DepositAccountFormProps = {
  open: boolean;
  mode: "create" | "edit";
  account: DepositAccount | null;
  /** Posted transactions on the account; locks opening fields in edit mode. */
  transactionCount?: number;
  saving: boolean;
  errorMessage?: string | null;
  /** Dialog keeps the stepper. Page shows every block as a section. */
  layout?: "dialog" | "page";
  depositTypeCd?: number;
  onClose: () => void;
  onSubmit: (
    input: DepositAccountCreateInput | DepositAccountEditInput,
    nominees: DepositNomineeSave,
    signatories: DepositSignatorySave,
  ) => void;
};

function FormSection({
  layout,
  id,
  title,
  collapsible = false,
  children,
}: {
  layout: "dialog" | "page";
  id: string;
  title: string;
  collapsible?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("deposits.savings.form");
  const [expanded, setExpanded] = useState(true);
  if (layout === "dialog") return children;
  const toggleLabel = expanded
    ? t("collapseSection", { section: title })
    : t("expandSection", { section: title });
  return (
    <Card
      title={title}
      trailing={
        collapsible ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={expanded ? ChevronUp : ChevronDown}
            aria-expanded={expanded}
            aria-controls={id}
            aria-label={toggleLabel}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t("collapse") : t("expand")}
          </Button>
        ) : undefined
      }
    >
      <div
        id={id}
        hidden={collapsible && !expanded}
        className={collapsible && !expanded ? "hidden" : "flex flex-col gap-4"}
      >
        {children}
      </div>
    </Card>
  );
}

function SavingsDetails({
  form,
  locked,
  showAccountNo,
  scheme,
  paymentModes,
  errors,
  onChange,
}: {
  form: FormState;
  locked: boolean;
  showAccountNo: boolean;
  scheme: DepositProductScheme | null;
  paymentModes: ApplOption[];
  errors: Record<string, string>;
  onChange: (partial: Partial<FormState>) => void;
}) {
  const t = useTranslations("deposits.savings");
  const tUi = useTranslations("ui");
  const format = useFormatter();
  const startDate = form.sbStartTouched ? form.sbStartDate : form.applDate;
  const minBalanceHint =
    scheme?.minBalance != null
      ? t("form.sb.minBalance", {
          amount: format.number(scheme.minBalance, {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        })
      : undefined;
  const hasOpening = Number(form.sbOpening) > 0;

  return (
    <div className="flex flex-col gap-4">
      {locked ? <p className="text-xs text-muted">{t("form.sb.locked")}</p> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateField
          label={t("form.sb.startDate")}
          required
          value={startDate}
          min={form.applDate || undefined}
          max={todayYmd()}
          disabled={locked}
          error={errors.sbStartDate}
          onChange={(sbStartDate) => onChange({ sbStartDate, sbStartTouched: true })}
        />
        <TextField
          label={t("form.sb.roi")}
          restrict="decimal"
          readOnly
          value={form.sbRoi}
          error={errors.sbRoi}
          placeholder={t("form.sb.roiPlaceholder")}
          onChange={(sbRoi) => onChange({ sbRoi, sbRoiTouched: true })}
        />
        {showAccountNo ? (
          <TextField
            label={t("form.sb.accountNo")}
            restrict="digits"
            value={form.sbAccountNo}
            maxLength={5}
            disabled={locked}
            error={errors.sbAccountNo}
            placeholder={t("form.sb.accountNoPlaceholder")}
            hint={t("form.sb.accountNoHint")}
            onChange={(sbAccountNo) => onChange({ sbAccountNo })}
          />
        ) : null}
        <TextField
          label={t("form.sb.refAcNo")}
          value={form.sbRefAcNo}
          maxLength={15}
          error={errors.sbRefAcNo}
          onChange={(sbRefAcNo) => onChange({ sbRefAcNo: sbRefAcNo.toUpperCase() })}
        />
        <TextField
          label={t("form.sb.cbsAcNo")}
          value={form.sbCbsAcNo}
          maxLength={25}
          error={errors.sbCbsAcNo}
          onChange={(sbCbsAcNo) => onChange({ sbCbsAcNo: sbCbsAcNo.toUpperCase() })}
        />
      </div>
      <fieldset className="flex flex-col gap-4 rounded-xl border border-border p-4" disabled={locked}>
        <legend className="px-1 text-xs font-semibold text-slate-600">
          {t("form.sb.openingSection")}
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label={t("form.sb.opening")}
            restrict="decimal"
            value={form.sbOpening}
            error={errors.sbOpening}
            placeholder="0"
            hint={minBalanceHint}
            onChange={(sbOpening) => onChange({ sbOpening })}
          />
          <SelectField
            label={t("form.sb.paymentMode")}
            value={form.sbPaymentModeCd}
            searchable={false}
            disabled={locked || !hasOpening}
            placeholder={t("form.sb.paymentMode")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(sbPaymentModeCd) => onChange({ sbPaymentModeCd })}
            options={
              paymentModes.length > 0
                ? [...paymentModes]
                    .sort((left, right) => left.optCode - right.optCode)
                    .map((option) => ({
                      value: String(option.optCode),
                      label: option.optDescription,
                    }))
                : [{ value: String(PAYMENT_MODE_CASH), label: t("form.sb.cash") }]
            }
          />
          <TextAreaField
            className="sm:col-span-2"
            label={t("form.sb.remarks")}
            value={form.sbRemarks}
            maxLength={250}
            rows={2}
            disabled={locked || !hasOpening}
            error={errors.sbRemarks}
            placeholder={t("form.sb.remarksPlaceholder")}
            onChange={(sbRemarks) => onChange({ sbRemarks })}
          />
        </div>
        <p className="text-xs text-muted">{t("form.sb.openingHint")}</p>
      </fieldset>
    </div>
  );
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const LAST_STEP: Step = 8;

type FormState = {
  step: Step;
  prodTypeCd: string;
  custTypeCd: number;
  customer: DepositCustomer | null;
  schemeId: string;
  opModeCd: string;
  joint1: DepositCustomer | null;
  joint2: DepositCustomer | null;
  holderName: string;
  holderNameManual: boolean;
  specialCatgCd: string;
  nomRegd: boolean;
  applDate: string;
  applNo: string;
  branchId: string;
  foId: string;
  statusCd: string;
  statusTouched: boolean;
  sbStartDate: string;
  sbStartTouched: boolean;
  sbAccountNo: string;
  sbRefAcNo: string;
  sbCbsAcNo: string;
  sbRoi: string;
  sbRoiTouched: boolean;
  sbOpening: string;
  sbPaymentModeCd: string;
  sbRemarks: string;
  term: TermDraft;
};

function customerFromAccount(
  account: DepositAccount,
  which: "primary" | "joint1" | "joint2",
): DepositCustomer | null {
  if (which === "joint1" && account.custIdJoint1 == null) return null;
  if (which === "joint2" && account.custIdJoint2 == null) return null;
  const id =
    which === "primary"
      ? account.custIdPrimary
      : which === "joint1"
        ? account.custIdJoint1
        : account.custIdJoint2;
  if (id == null) return null;
  const name =
    which === "primary"
      ? account.primaryName
      : which === "joint1"
        ? account.joint1Name
        : account.joint2Name;
  const refCode =
    which === "primary"
      ? account.primaryRefCode
      : which === "joint1"
        ? account.joint1RefCode
        : account.joint2RefCode;
  return {
    id,
    name,
    refCode,
    mobile: which === "primary" ? account.primaryMobile : null,
    branchId: account.branchId,
    branchCode: account.branchCode,
    branchName: account.branchName,
    foId: account.foId,
    foCode: account.foCode,
    foName: account.foName,
    anchorDate: null,
    dateOfBirth: null,
    kycPendingCount: 0,
  };
}

function emptyState(): FormState {
  return {
    step: 1,
    prodTypeCd: "",
    custTypeCd: CUST_TYPE_INDIVIDUAL,
    customer: null,
    schemeId: "",
    opModeCd: "1",
    joint1: null,
    joint2: null,
    holderName: "",
    holderNameManual: false,
    specialCatgCd: String(SPECIAL_NORMAL),
    nomRegd: false,
    applDate: todayYmd(),
    applNo: "",
    branchId: "",
    foId: "",
    statusCd: String(STATUS_ACTIVE),
    statusTouched: false,
    sbStartDate: "",
    sbStartTouched: false,
    sbAccountNo: "",
    sbRefAcNo: "",
    sbCbsAcNo: "",
    sbRoi: "",
    sbRoiTouched: false,
    sbOpening: "",
    sbPaymentModeCd: String(PAYMENT_MODE_CASH),
    sbRemarks: "",
    term: emptyTermDraft(),
  };
}

function stateFromAccount(account: DepositAccount): FormState {
  return {
    ...emptyState(),
    prodTypeCd: account.prodTypeCd != null ? String(account.prodTypeCd) : "",
    custTypeCd: account.custTypeCd,
    customer: customerFromAccount(account, "primary"),
    schemeId: String(account.schemeId),
    opModeCd: String(account.opModeCd),
    joint1: customerFromAccount(account, "joint1"),
    joint2: customerFromAccount(account, "joint2"),
    holderName: account.holderName,
    specialCatgCd:
      account.specialCatgCd != null
        ? String(account.specialCatgCd)
        : String(SPECIAL_NORMAL),
    nomRegd: account.nomRegd,
    applDate: account.applDate || todayYmd(),
    applNo: account.applNo,
    branchId: account.branchId != null ? String(account.branchId) : "",
    foId: account.foId != null ? String(account.foId) : "",
    statusCd: String(account.statusCd),
    statusTouched: true,
    sbStartDate: account.startDate || account.applDate,
    sbStartTouched: true,
    sbAccountNo: account.accountNo != null ? String(account.accountNo) : "",
    sbRefAcNo: account.refAcNo ?? "",
    sbCbsAcNo: account.cbsAcNo ?? "",
    sbRoi:
      account.sbRoi != null
        ? String(account.sbRoi)
        : account.schemeRoiPercent != null
          ? String(account.schemeRoiPercent)
          : "",
    sbRoiTouched: account.sbRoi != null,
    sbOpening:
      account.openingDeposit != null ? String(account.openingDeposit) : "",
  };
}

const TERM_FIELD_FOR_SB: Record<string, string> = {
  sbStartDate: "tdStartDate",
  sbRefAcNo: "tdRefAcNo",
};

function stepForField(field: string): Step {
  if (field === "prodTypeCd" || field === "schemeId") return 1;
  if (field === "custIdPrimary") return 2;
  if (field.startsWith("sb") || field.startsWith("td")) return 4;
  if (
    field === "applDate" ||
    field === "applNo" ||
    field === "branchId" ||
    field === "foId"
  ) {
    return 5;
  }
  if (field === "nominees") return 6;
  if (field === "signatories") return 7;
  return 3;
}

export function DepositAccountForm({
  open,
  mode,
  account,
  transactionCount = 0,
  saving,
  errorMessage,
  layout = "dialog",
  depositTypeCd = SAVINGS_DEPOSIT_TYPE,
  onClose,
  onSubmit,
}: DepositAccountFormProps) {
  const t = useTranslations("deposits.savings");
  const formKey = mode === "edit" ? `edit-${account?.accountId ?? 0}` : "create";
  const body = (
    <DepositAccountFormBody
      key={formKey}
      layout={layout}
      depositTypeCd={depositTypeCd}
      mode={mode}
      account={account}
      transactionCount={transactionCount}
      saving={saving}
      errorMessage={errorMessage}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );

  if (layout === "page") return body;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? t("form.createTitle") : t("form.editTitle")}
      subtitle={t("form.stepHint")}
      size="lg"
    >
      {body}
    </Modal>
  );
}

function DepositAccountFormBody({
  layout = "dialog",
  depositTypeCd = SAVINGS_DEPOSIT_TYPE,
  mode,
  account,
  transactionCount = 0,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: Omit<DepositAccountFormProps, "open">) {
  const t = useTranslations("deposits.savings");
  const tUi = useTranslations("ui");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const isTerm = depositTypeCd === TERM_DEPOSIT_TYPE;
  const [form, setForm] = useState<FormState>(() =>
    account ? stateFromAccount(account) : emptyState(),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [nominees, setNominees] = useState<NomineeDraft[]>([]);
  const [listedNominees, setListedNominees] = useState<DepositNominee[]>([]);
  const [nomineesLoading, setNomineesLoading] = useState(false);
  const [nomineesListError, setNomineesListError] = useState<string | null>(null);
  const nomineesRef = useRef(nominees);
  nomineesRef.current = nominees;
  const [signatories, setSignatories] = useState<SignatoryDraft[]>([]);
  const signatoriesRef = useRef(signatories);
  signatoriesRef.current = signatories;
  const [signatoryDeactivateIds, setSignatoryDeactivateIds] = useState<number[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [deactivateIds, setDeactivateIds] = useState<number[]>([]);
  const [relations, setRelations] = useState<ApplOption[]>([]);
  const [products, setProducts] = useState<DepositProductType[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [custTypes, setCustTypes] = useState<ApplOption[]>([]);
  const [statuses, setStatuses] = useState<ApplOption[]>([]);
  const [opModes, setOpModes] = useState<ApplOption[]>([]);
  const [categories, setCategories] = useState<ApplOption[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [paymentModes, setPaymentModes] = useState<ApplOption[]>([]);
  const [maturityOptions, setMaturityOptions] = useState<ApplOption[]>([]);
  const [sbAccountOptions, setSbAccountOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [sbAccountsLoading, setSbAccountsLoading] = useState(false);
  const [officers, setOfficers] = useState<
    { value: string; label: string }[]
  >([]);

  const effectiveBranchId = form.branchId
    ? Number(form.branchId)
    : (form.customer?.branchId ?? (account?.branchId ?? null));

  const branchOptions = useMemo(() => {
    const opts = branches.map((branch) => ({
      value: String(branch.branchId),
      label: branch.branchCode
        ? `${branch.branchCode} · ${branch.branchName}`
        : branch.branchName,
    }));
    if (account?.branchId && account.branchName) {
      const accountBranchIdStr = String(account.branchId);
      if (!opts.some((opt) => opt.value === accountBranchIdStr)) {
        opts.unshift({
          value: accountBranchIdStr,
          label: account.branchCode
            ? `${account.branchCode} · ${account.branchName}`
            : account.branchName,
        });
      }
    }
    const customer = form.customer;
    if (customer?.branchId && customer.branchName) {
      const customerBranchIdStr = String(customer.branchId);
      if (!opts.some((opt) => opt.value === customerBranchIdStr)) {
        opts.unshift({
          value: customerBranchIdStr,
          label: customer.branchCode
            ? `${customer.branchCode} · ${customer.branchName}`
            : customer.branchName,
        });
      }
    }
    return opts;
  }, [
    branches,
    account?.branchId,
    account?.branchCode,
    account?.branchName,
    form.customer?.branchId,
    form.customer?.branchCode,
    form.customer?.branchName,
  ]);

  const locked = mode === "edit" && accountFieldsLocked(account, transactionCount);
  const sbLocked = mode === "edit" && savingsFieldsLocked(account, transactionCount);
  const joints = jointVisibility(form.custTypeCd, Number(form.opModeCd) || 0);
  const prodTypeCd = form.prodTypeCd ? Number(form.prodTypeCd) : null;
  const requiredCustType = isTerm ? null : custTypeForProduct(prodTypeCd);
  const selectedProduct =
    products.find((product) => product.prodTypeCd === prodTypeCd) ?? null;
  const schemes = selectedProduct?.schemes ?? [];
  const schemeLabel = (scheme: DepositProductScheme) =>
    [
      scheme.schemeCode,
      scheme.schemeName,
      scheme.roiPercent != null
        ? t("roiPercent", {
            value: format.number(scheme.roiPercent, { maximumFractionDigits: 2 }),
          })
        : "",
      scheme.minBalance != null
        ? t("form.minBalanceShort", {
            amount: format.number(scheme.minBalance, {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 2,
            }),
          })
        : "",
    ]
      .filter(Boolean)
      .join(" · ");
  const schemeOptions = schemes.map((scheme) => ({
    value: String(scheme.schemeId),
    label: schemeLabel(scheme),
  }));
  if (
    account &&
    form.schemeId &&
    !schemeOptions.some((option) => option.value === form.schemeId)
  ) {
    schemeOptions.unshift({
      value: form.schemeId,
      label: [account.schemeCode, account.schemeName].filter(Boolean).join(" · "),
    });
  }
  const selectedScheme =
    schemes.find((scheme) => String(scheme.schemeId) === form.schemeId) ?? null;
  const age =
    form.customer?.dateOfBirth != null
      ? ageOn(form.customer.dateOfBirth, form.applDate || todayYmd())
      : null;
  const preview = holderPreview(
    form.customer?.name ?? "",
    joints.joint1 ? (form.joint1?.name ?? "") : "",
    joints.joint2 ? (form.joint2?.name ?? "") : "",
  );
  const shownHolder = form.holderNameManual ? form.holderName : preview;
  const anchorDate = form.customer?.anchorDate
    ? parseYmd(form.customer.anchorDate)
    : null;
  const anchorLabel = anchorDate
    ? format.dateTime(anchorDate, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : t("dash");

  useEffect(() => {
    if (!errorMessage) return;
    const field = mapApiMessageToField(errorMessage);
    if (!field || field === "toast" || field === "close") return;
    if (field === "nominees") {
      const targeted = nomineeErrorTarget(
        errorMessage,
        nomineesRef.current.filter((draft) => draft.nomineeId == null),
      );
      setFieldErrors((current) => ({ ...current, ...(targeted ?? { nominees: errorMessage }) }));
      setForm((current) => ({ ...current, step: 6 }));
      return;
    }
    if (field === "signatories") {
      const targeted = signatoryErrorTarget(
        errorMessage,
        signatoriesRef.current.filter((draft) => draft.signatoryId == null),
      );
      setFieldErrors((current) => ({
        ...current,
        ...(targeted ?? { signatories: errorMessage }),
      }));
      setForm((current) => ({ ...current, step: 7 }));
      return;
    }
    const target = isTerm ? (TERM_FIELD_FOR_SB[field] ?? field) : field;
    setFieldErrors((current) => ({ ...current, [target]: errorMessage }));
    setForm((current) => ({ ...current, step: stepForField(target) }));
  }, [errorMessage, isTerm]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [
        customerTypes,
        statusOptions,
        modes,
        specials,
        relationOptions,
        payModes,
        branchResult,
      ] = await Promise.all([
        fetchApplOptions(OPT_CUST_TYPE).catch((): ApplOption[] => []),
        fetchApplOptions(OPT_STATUS).catch((): ApplOption[] => []),
        fetchApplOptions(OPT_OP_MODE).catch((): ApplOption[] => []),
        fetchApplOptions(OPT_SPECIAL).catch((): ApplOption[] => []),
        fetchApplOptions(OPT_RELATION).catch((): ApplOption[] => []),
        fetchApplOptions(OPT_PAYMENT_MODE).catch((): ApplOption[] => []),
        fetchBranchList({ page: 1, perPage: 200, isActive: 1 }).catch((): null => null),
      ]);
      if (cancelled) return;
      setCustTypes(customerTypes);
      setStatuses(statusOptions);
      setOpModes(modes);
      setCategories(specials);
      setRelations(
        (relationOptions ?? []).filter(
          (option: ApplOption) => option.optCode !== RELATION_SELF,
        ),
      );
      setPaymentModes(payModes);
      if (branchResult?.items) {
        setBranches(branchResult.items);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    setProductsError(false);
    fetchDepositProducts({ depositTypeCd, isActive: 1 })
      .then((items) => {
        if (!cancelled) setProducts(items);
      })
      .catch(() => {
        if (!cancelled) setProductsError(true);
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [depositTypeCd]);

  useEffect(() => {
    if (!isTerm) return;
    let cancelled = false;
    fetchApplOptions(OPT_MATURITY_INSTRUCTION)
      .then((items) => {
        if (!cancelled) setMaturityOptions(items);
      })
      .catch(() => {
        if (!cancelled) setMaturityOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isTerm]);

  const sbCreditWanted = isTerm && needsSbCredit(form.term.matuInsCd);
  const customerId = form.customer?.id ?? null;
  useEffect(() => {
    if (!sbCreditWanted || customerId == null) {
      setSbAccountOptions([]);
      setSbAccountsLoading(false);
      return;
    }
    let cancelled = false;
    setSbAccountsLoading(true);
    const group = form.custTypeCd === CUST_TYPE_GROUP;
    fetchDepositAccounts({
      depositTypeCd: SAVINGS_DEPOSIT_TYPE,
      custTypeCd: form.custTypeCd,
      memberId: group ? undefined : customerId,
      groupId: group ? customerId : undefined,
      isClosed: false,
      perPage: 100,
    })
      .then((result) => {
        if (cancelled) return;
        setSbAccountOptions(
          result.items
            .filter(
              (item) =>
                item.custIdPrimary === customerId &&
                item.custTypeCd === form.custTypeCd &&
                !item.isClosed,
            )
            .map((item) => ({
              value: String(item.accountId),
              label: t("form.term.sbCreditOption", {
                account: item.fullAccountNo || item.applNo,
                scheme: item.schemeName || item.schemeCode,
              }),
            })),
        );
      })
      .catch(() => {
        if (!cancelled) setSbAccountOptions([]);
      })
      .finally(() => {
        if (!cancelled) setSbAccountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, form.custTypeCd, sbCreditWanted, t]);

  useEffect(() => {
    if (effectiveBranchId == null) {
      setOfficers([]);
      return;
    }
    let cancelled = false;
    fetchStaffList({ branchId: effectiveBranchId, status: 1, perPage: 200 })
      .then((result) => {
        if (cancelled) return;
        const options = result.items.map((staff) => ({
          value: String(staff.staffId),
          label: staff.employeeCode
            ? `${staff.fullName} · ${staff.employeeCode}`
            : staff.fullName,
        }));
        if (
          form.foId &&
          !options.some((option) => option.value === form.foId) &&
          account?.foName
        ) {
          options.unshift({
            value: form.foId,
            label: account.foName,
          });
        }
        setOfficers(options);
      })
      .catch(() => {
        if (!cancelled) setOfficers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [account?.foName, effectiveBranchId, form.foId]);

  const lastStepRef = useRef(form.step);
  useEffect(() => {
    const prevStep = lastStepRef.current;
    lastStepRef.current = form.step;

    if (prevStep === form.step) {
      return;
    }

    if (layout === "page") {
      if (form.step === 1) {
        const scroller = formRef.current?.closest(".overflow-y-auto");
        if (scroller instanceof HTMLElement) {
          scroller.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }
      document
        .getElementById(`deposit-account-section-${form.step}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const scroller = formRef.current?.closest(".overflow-y-auto");
    if (scroller instanceof HTMLElement) scroller.scrollTop = 0;
  }, [form.step, layout]);

  useEffect(() => {
    if (mode !== "edit" || account?.accountId == null || form.custTypeCd !== CUST_TYPE_INDIVIDUAL) {
      return;
    }
    let cancelled = false;
    fetchDepositNominees(account.accountId)
      .then((items) => {
        if (cancelled) return;
        const active = items.filter((item) => item.isActive);
        setNominees(active.map(draftFromNominee));
        setDeactivateIds([]);
      })
      .catch(() => {
        if (!cancelled) {
          setFieldErrors((current) => ({
            ...current,
            nominees: t("form.nominees.loadError"),
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [account?.accountId, form.custTypeCd, mode, t]);

  useEffect(() => {
    if (!form.nomRegd || form.custTypeCd !== CUST_TYPE_INDIVIDUAL) return;
    const memberId = form.customer?.id;
    if (memberId == null) {
      setListedNominees([]);
      setNomineesListError(t("form.nominees.memberRequired"));
      setNomineesLoading(false);
      return;
    }
    let cancelled = false;
    setNomineesLoading(true);
    setNomineesListError(null);
    fetchMemberNominees(memberId)
      .then((items) => {
        if (cancelled) return;
        setListedNominees(
          items
            .filter((item) => item.isActive)
            .map((item) => ({
              nomineeId: item.memberNomineeId,
              accountId: 0,
              nomCustId: null,
              nomCustRefCode: "",
              nomName: item.nomineeName,
              contactNo: item.nomineeMobile ?? "",
              relationCd: item.nomineeRelCd,
              relationDesc: item.relationDesc,
              age: item.nomineeAge,
              birthDate: item.nomineeDob,
              address: "",
              guardianName: "",
              sharePercent: item.sharePercent,
              isActive: item.isActive,
              isMinor: item.isMinor,
            })),
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setListedNominees([]);
        setNomineesListError(
          isMemberClientError(error) ? error.message : t("form.nominees.loadError"),
        );
      })
      .finally(() => {
        if (!cancelled) setNomineesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.custTypeCd, form.customer?.id, form.nomRegd, t]);

  useEffect(() => {
    if (mode !== "edit" || account?.accountId == null) return;
    let cancelled = false;
    fetchDepositSignatories(account.accountId)
      .then((items) => {
        if (cancelled) return;
        setSignatories(items.filter((item) => item.isActive).map(draftFromSignatory));
        setSignatoryDeactivateIds([]);
      })
      .catch(() => {
        if (!cancelled) {
          setFieldErrors((current) => ({
            ...current,
            signatories: t("form.signatories.loadError"),
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [account?.accountId, mode, t]);

  const detailsStepLabel = isTerm ? t("form.term.stepTerm") : t("form.stepSavings");
  const steps = useMemo(
    () =>
      [
        { id: 1 as const, label: t("form.stepProduct") },
        { id: 2 as const, label: t("form.stepCustomer") },
        { id: 3 as const, label: t("form.stepHolders") },
        { id: 4 as const, label: detailsStepLabel },
        { id: 5 as const, label: t("form.stepApplication") },
        { id: 6 as const, label: t("form.stepNominees") },
        { id: 7 as const, label: t("form.stepSignatories") },
        { id: 8 as const, label: t("form.stepSummary") },
      ],
    [detailsStepLabel, t],
  );

  function patch(partial: Partial<FormState>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function patchTerm(partial: Partial<TermDraft>) {
    setForm((current) => ({ ...current, term: { ...current.term, ...partial } }));
  }

  function termError(issue: TermIssue): string {
    return t(`form.term.errors.${issue}`);
  }

  function selectCustomer(customer: DepositCustomer | null) {
    patch({
      customer,
      branchId:
        customer?.branchId != null
          ? String(customer.branchId)
          : form.branchId,
      joint1:
        form.joint1 && customer && form.joint1.id === customer.id
          ? null
          : form.joint1,
      joint2:
        form.joint2 && customer && form.joint2.id === customer.id
          ? null
          : form.joint2,
      foId:
        customer?.foId != null ? String(customer.foId) : form.foId,
      statusCd:
        !form.statusTouched && (customer?.kycPendingCount ?? 0) > 0
          ? String(STATUS_KYC_PENDING)
          : form.statusCd,
    });
    setFieldErrors((current) => ({ ...current, custIdPrimary: "", branchId: "" }));
  }

  function selectProduct(product: DepositProductType) {
    const nextCustType = isTerm ? null : custTypeForProduct(product.prodTypeCd);
    patch({
      prodTypeCd: String(product.prodTypeCd),
      schemeId: "",
      sbRoi: form.sbRoiTouched ? form.sbRoi : "",
    });
    setFieldErrors((current) => ({ ...current, prodTypeCd: "", schemeId: "" }));
    if (nextCustType != null && nextCustType !== form.custTypeCd) {
      selectCustType(nextCustType);
    }
  }

  function selectScheme(schemeId: string) {
    const scheme = schemes.find((item) => String(item.schemeId) === schemeId);
    patch({
      schemeId,
      sbRoi:
        form.sbRoiTouched || scheme?.roiPercent == null
          ? form.sbRoi
          : String(scheme.roiPercent),
    });
    setFieldErrors((current) => ({ ...current, schemeId: "" }));
  }

  function selectCustType(custTypeCd: number) {
    const next: Partial<FormState> = {
      custTypeCd,
      customer: null,
      joint1: null,
      joint2: null,
      nomRegd: false,
    };
    if (custTypeCd === CUST_TYPE_GROUP) {
      setNominees([]);
      if (!isOpModeAllowed(CUST_TYPE_GROUP, Number(form.opModeCd))) {
        next.opModeCd = "5";
      }
      if (
        !isSpecialAllowed(CUST_TYPE_GROUP, Number(form.specialCatgCd), null)
      ) {
        next.specialCatgCd = String(SPECIAL_NORMAL);
      }
    }
    patch(next);
  }

  function selectMode(opModeCd: string) {
    const visibility = jointVisibility(form.custTypeCd, Number(opModeCd));
    patch({
      opModeCd,
      joint1: visibility.joint1 ? form.joint1 : null,
      joint2: visibility.joint2 ? form.joint2 : null,
    });
    setFieldErrors((current) => ({ ...current, opModeCd: "" }));
  }

  function validateStep(step: Step): boolean {
    const next: Record<string, string> = {};
    if (step === 1 && !locked) {
      if (!form.prodTypeCd) next.prodTypeCd = t("form.errors.productType");
      if (!form.schemeId) next.schemeId = t("form.errors.scheme");
    }
    if (step === 2) {
      if (!form.customer) next.custIdPrimary = t("form.errors.customer");
      if (!locked && requiredCustType != null && form.custTypeCd !== requiredCustType) {
        next.custIdPrimary = t("form.errors.customerType");
      }
    }
    if (step === 4 && isTerm) {
      const issues = termIssues(form.term, form.applDate, prodTypeCd);
      for (const [field, issue] of Object.entries(issues)) {
        if (issue) next[field] = termError(issue);
      }
    }
    if (step === 4 && !isTerm) {
      const start = form.sbStartTouched ? form.sbStartDate : form.applDate;
      if (!start || start < form.applDate || start > todayYmd()) {
        next.sbStartDate = t("form.errors.sbStart");
      }
      if (form.sbAccountNo.trim()) {
        const accountNo = Number(form.sbAccountNo);
        if (!Number.isInteger(accountNo) || accountNo < 1 || accountNo > 32767) {
          next.sbAccountNo = t("form.errors.sbAccount");
        }
      }
      if (form.sbRefAcNo.trim().length > 15) next.sbRefAcNo = t("form.errors.sbRef");
      if (form.sbCbsAcNo.trim().length > 25) next.sbCbsAcNo = t("form.errors.sbCbs");
      if (form.sbRoi.trim()) {
        const roi = Number(form.sbRoi);
        if (!Number.isFinite(roi) || roi < 0 || roi > 100) next.sbRoi = t("form.errors.sbRoi");
      }
      if (form.sbOpening.trim()) {
        const opening = Number(form.sbOpening);
        if (!Number.isFinite(opening) || opening < 0) next.sbOpening = t("form.errors.sbOpening");
      }
      if (form.sbRemarks.trim().length > 250) next.sbRemarks = t("form.errors.sbRemarks");
    }
    if (step === 5 && form.applDate) {
      if (form.applDate > todayYmd()) next.applDate = t("form.errors.applDate");
      if (form.customer?.anchorDate && form.applDate < form.customer.anchorDate) {
        next.applDate = t("form.errors.applDate");
      }
    }
    if (step === 3) {
      if (!form.opModeCd) next.opModeCd = t("form.errors.opMode");
      if (joints.joint1 && !form.joint1) next.custIdJoint1 = t("form.errors.joint1");
      if (joints.joint2Required && !form.joint2) {
        next.custIdJoint2 = t("form.errors.joint2");
      }
      if (form.holderNameManual && form.holderName.trim().length > 300) {
        next.holderName = t("form.errors.holderName");
      }
    }
    if (step === 5) {
      if (!form.applDate) next.applDate = t("form.errors.applDate");
      if (form.applNo.trim().length > 25) next.applNo = t("form.errors.applNo");
    }
    if (step === 7) {
      const holderIds = [form.customer?.id, form.joint1?.id, form.joint2?.id].filter(
        (id): id is number => id != null,
      );
      for (const issue of signatoryIssues(
        signatories,
        holderIds,
        signatoryPickerMode(form.custTypeCd, Number(form.opModeCd) || 0) === "holders",
      )) {
        const fieldKey = issue.field === "limit" ? "signatories" : `${issue.key}.${issue.field}`;
        next[fieldKey] = signatoryError(issue.field);
      }
    }
    if (
      step === 6 &&
      form.custTypeCd === CUST_TYPE_INDIVIDUAL &&
      listedNominees.length === 0
    ) {
      const holderIds = [form.customer?.id, form.joint1?.id, form.joint2?.id].filter(
        (id): id is number => id != null,
      );
      for (const issue of nomineeIssues(
        nominees,
        holderIds,
        0,
        0,
      )) {
        const fieldKey = issue.field === "total" || issue.field === "limit" ? "nominees" : `${issue.key}.${issue.field}`;
        next[fieldKey] = nomineeError(issue.field);
      }
    }
    setFieldErrors((current) => {
      const owned =
        step === 6
          ? new Set(nominees.map((draft) => draft.key))
          : step === 7
            ? new Set(signatories.map((draft) => draft.key))
            : null;
      const bucket = step === 6 ? "nominees" : step === 7 ? "signatories" : "";
      const base = owned
        ? Object.fromEntries(
            Object.entries(current).filter(([key]) => {
              if (key === bucket) return false;
              return !owned.has(key.split(".")[0] ?? "");
            }),
          )
        : current;
      return { ...base, ...next };
    });
    return Object.keys(next).length === 0;
  }

  function nomineeError(field: string): string {
    if (field === "member") return t("form.errors.nomineeMember");
    if (field === "nomName") return t("form.errors.nomineeName");
    if (field === "relationCd") return t("form.errors.nomineeRelation");
    if (field === "birthDate" || field === "age") return t("form.errors.nomineeBirth");
    if (field === "guardianName") return t("form.errors.nomineeGuardian");
    if (field === "contactNo") return t("form.errors.nomineeContact");
    if (field === "address") return t("form.errors.nomineeAddress");
    if (field === "sharePercent" || field === "total") return t("form.errors.nomineeShare");
    return t("form.errors.nomineeLimit");
  }

  function signatoryError(field: string): string {
    if (field === "signFileNm" || field === "photoFileNm") {
      return t("form.errors.signatoryFile");
    }
    if (field === "limit") return t("form.errors.signatoryLimit");
    return t("form.errors.signatoryMember");
  }

  function goNext(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!validateStep(form.step)) return;
    patch({ step: Math.min(LAST_STEP, form.step + 1) as Step });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
  }

  function saveAccount() {
    if (layout === "dialog" && form.step !== LAST_STEP) return;
    for (const step of [1, 2, 3, 4, 5, 6, 7] as const) {
      if (!validateStep(step)) {
        patch({ step });
        return;
      }
    }
    if (!form.customer || !form.schemeId) return;
    const openingDeposit = form.sbOpening.trim() ? Number(form.sbOpening) : null;
    const savingsDetails = {
      startDate: form.sbStartTouched ? form.sbStartDate : undefined,
      accountNo: form.sbAccountNo.trim() ? Number(form.sbAccountNo) : null,
      refAcNo: form.sbRefAcNo.trim().toUpperCase() || null,
      cbsAcNo: form.sbCbsAcNo.trim().toUpperCase() || null,
      roi: form.sbRoiTouched && form.sbRoi.trim() ? Number(form.sbRoi) : undefined,
      openingDeposit,
      paymentModeCd:
        openingDeposit != null && openingDeposit > 0
          ? Number(form.sbPaymentModeCd) || PAYMENT_MODE_CASH
          : null,
      remarks:
        openingDeposit != null && openingDeposit > 0 ? form.sbRemarks.trim() || null : null,
    };
    const snapshot = {
      applDate: form.applDate,
      prodTypeCd: prodTypeCd,
      schemeId: Number(form.schemeId),
      custTypeCd: form.custTypeCd,
      custIdPrimary: form.customer.id,
      opModeCd: Number(form.opModeCd),
      applNo: form.applNo,
      specialCatgCd: form.specialCatgCd ? Number(form.specialCatgCd) : null,
      custIdJoint1: form.joint1?.id ?? null,
      custIdJoint2: form.joint2?.id ?? null,
      holderName: form.holderNameManual ? form.holderName.trim() : null,
      holderNameManual: form.holderNameManual,
      nomRegd:
        form.custTypeCd === CUST_TYPE_INDIVIDUAL &&
        (form.nomRegd || nominees.length > 0),
      foId: form.foId ? Number(form.foId) : null,
      branchId: effectiveBranchId,
      statusCd: Number(form.statusCd) === STATUS_KYC_PENDING ? 7 : 1,
      sb: isTerm ? undefined : savingsDetails,
      td: isTerm ? toTermInput(form.term, prodTypeCd) : undefined,
    };
    const nomineePayload =
      form.custTypeCd === CUST_TYPE_INDIVIDUAL && listedNominees.length === 0
        ? toNomineeSave(nominees, deactivateIds)
        : { add: [], edit: [], deactivate: [] };
    const signatoryPayload = toSignatorySave(signatories, signatoryDeactivateIds);
    if (mode === "edit" && account) {
      onSubmit(toEditInput(account, snapshot), nomineePayload, signatoryPayload);
    } else {
      onSubmit(toCreateInput(snapshot), nomineePayload, signatoryPayload);
    }
  }

  const year = (form.applDate || todayYmd()).slice(0, 4);
  const applDateLabel = parseYmd(form.applDate)
    ? format.dateTime(parseYmd(form.applDate) as Date, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : t("dash");
  const officerLabel =
    officers.find((officer) => officer.value === form.foId)?.label ||
    form.customer?.foName ||
    t("dash");
  const termAmount = Number(form.term.instAmount);
  const termSummary = {
    title: t("form.term.stepTerm"),
    rows: [
      {
        label: t("form.term.roi"),
        value:
          selectedScheme?.roiPercent != null
            ? t("roiPercent", {
                value: format.number(selectedScheme.roiPercent, {
                  maximumFractionDigits: 2,
                }),
              })
            : t("form.term.roiPlaceholder"),
      },
      {
        label: t("form.term.period"),
        value: t("form.term.periodValue", {
          years: Number(form.term.periodYy) || 0,
          months: Number(form.term.periodMm) || 0,
          days: Number(form.term.periodDd) || 0,
        }),
      },
      {
        label: takesInstallments(prodTypeCd)
          ? t("form.term.installmentAmount")
          : t("form.term.depositAmount"),
        value:
          Number.isFinite(termAmount) && termAmount > 0
            ? format.number(termAmount, {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : t("dash"),
      },
      ...(takesInstallments(prodTypeCd)
        ? [
            {
              label: t("form.term.instNo"),
              value: form.term.instNo.trim() || t("form.term.instNoPlaceholder"),
            },
          ]
        : []),
      {
        label: t("form.term.maturityInstruction"),
        value:
          maturityOptions.find((option) => String(option.optCode) === form.term.matuInsCd)
            ?.optDescription || t("dash"),
      },
      ...(needsSbCredit(form.term.matuInsCd)
        ? [
            {
              label: t("form.term.sbCredit"),
              value:
                sbAccountOptions.find((option) => option.value === form.term.sbCreditAcId)
                  ?.label || t("dash"),
            },
          ]
        : []),
      {
        label: t("form.term.tdsDeduct"),
        value: form.term.tdsDeduct ? tCommon("yes") : tCommon("no"),
      },
    ],
  };
  const openingAmount = Number(form.sbOpening);
  const paymentModeLabel =
    paymentModes.find((option) => String(option.optCode) === form.sbPaymentModeCd)
      ?.optDescription || t("form.sb.cash");
  const summarySections = [
    {
      title: t("form.stepProduct"),
      rows: [
        {
          label: t("form.productType"),
          value: selectedProduct?.prodTypeDesc || account?.prodTypeDesc || t("dash"),
        },
        {
          label: t("form.scheme"),
          value:
            schemeOptions.find((option) => option.value === form.schemeId)?.label ||
            t("dash"),
        },
      ],
    },
    {
      title: t("form.stepCustomer"),
      rows: [
        {
          label: t("form.customerType"),
          value:
            form.custTypeCd === CUST_TYPE_GROUP
              ? t("form.group")
              : t("form.individual"),
        },
        {
          label: t("form.customer"),
          value: form.customer
            ? [form.customer.name, form.customer.refCode].filter(Boolean).join(" · ")
            : t("dash"),
        },
        {
          label: t("form.branch"),
          value: form.customer?.branchName || t("dash"),
        },
      ],
    },
    {
      title: t("form.stepHolders"),
      rows: [
        {
          label: t("form.operationMode"),
          value:
            opModes.find((option) => String(option.optCode) === form.opModeCd)
              ?.optDescription || t("dash"),
        },
        { label: t("form.holderName"), value: shownHolder || t("dash") },
        {
          label: t("form.specialCategory"),
          value:
            categories.find((option) => String(option.optCode) === form.specialCatgCd)
              ?.optDescription || t("dash"),
        },
        ...(form.joint1
          ? [{ label: t("form.joint1"), value: form.joint1.name }]
          : []),
        ...(form.joint2
          ? [{ label: t("form.joint2"), value: form.joint2.name }]
          : []),
      ],
    },
    isTerm ? termSummary : {
      title: t("form.stepSavings"),
      rows: [
        ...(mode === "edit"
          ? [
              {
                label: t("form.sb.accountNo"),
                value: form.sbAccountNo.trim() || t("form.sb.accountNoPlaceholder"),
              },
            ]
          : []),
        {
          label: t("form.sb.roi"),
          value: form.sbRoi.trim()
            ? t("roiPercent", { value: form.sbRoi.trim() })
            : t("dash"),
        },
        {
          label: t("form.sb.opening"),
          value:
            Number.isFinite(openingAmount) && openingAmount > 0
              ? t("form.summary.opening", {
                  amount: format.number(openingAmount, {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                  mode: paymentModeLabel,
                })
              : t("form.summary.none"),
        },
      ],
    },
    {
      title: t("form.stepApplication"),
      rows: [
        { label: t("form.applDate"), value: applDateLabel },
        { label: t("form.applNo"), value: form.applNo.trim() || t("form.applNoPlaceholder", { year }) },
        { label: t("form.branch"), value: branchOptions.find((b) => b.value === String(effectiveBranchId))?.label || form.customer?.branchName || t("dash") },
        { label: t("form.fieldOfficer"), value: officerLabel },
        ...(mode === "create"
          ? [
              {
                label: t("form.initialStatus"),
                value:
                  form.statusCd === String(STATUS_KYC_PENDING)
                    ? t("form.kycPending")
                    : t("form.active"),
              },
            ]
          : []),
      ],
    },
    {
      title: t("form.stepNominees"),
      rows:
        form.custTypeCd === CUST_TYPE_GROUP
          ? [{ label: t("form.stepNominees"), value: t("form.summary.notApplicable") }]
          : form.nomRegd && listedNominees.length > 0
            ? listedNominees.map((nominee, index) => ({
                  label: t("form.nominees.block", { number: index + 1 }),
                  value: [
                    nominee.nomName || t("dash"),
                    nominee.relationDesc,
                    nominee.age != null
                      ? t("form.nominees.ageValue", { age: nominee.age })
                      : "",
                    nominee.sharePercent != null
                      ? t("form.nominees.shareValue", { percent: nominee.sharePercent })
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · "),
                }))
          : nominees.length === 0
            ? [{ label: t("form.stepNominees"), value: t("form.summary.none") }]
            : nominees.map((draft, index) => {
                const ageValue = nomineeAge(draft);
                return {
                  label: t("form.nominees.block", { number: index + 1 }),
                  value: [
                    draft.nomName || draft.member?.name || t("dash"),
                    relations.find((option) => String(option.optCode) === draft.relationCd)
                      ?.optDescription,
                    ageValue != null
                      ? t("form.nominees.ageValue", { age: ageValue })
                      : "",
                    draft.sharePercent
                      ? t("form.nominees.shareValue", { percent: draft.sharePercent })
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · "),
                };
              }),
    },
    {
      title: t("form.stepSignatories"),
      rows:
        signatories.length === 0
          ? [{ label: t("form.stepSignatories"), value: t("form.summary.none") }]
          : signatories.map((draft, index) => ({
              label: t("form.signatories.block", { number: index + 1 }),
              value: [draft.member?.name, draft.role].filter(Boolean).join(" · ") || t("dash"),
            })),
    },
  ];

  const show = (step: Step) => layout === "page" || form.step === step;

  return (
    <form autoComplete="off"
      ref={formRef}
      className={layout === "page" ? "flex flex-col gap-5" : "flex flex-col gap-4"}
      onSubmit={handleSubmit}
    >
      {layout === "dialog" ? (
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step) => {
          const active = form.step === step.id;
          const done = form.step > step.id;
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!done && !active}
                onClick={() => {
                  if (done) patch({ step: step.id });
                }}
                className={`w-full rounded-xl border px-3 py-2 text-start text-xs font-semibold ${
                  active
                    ? "border-brand bg-brand-soft text-brand-ink"
                    : "border-border bg-surface text-slate-600"
                } disabled:cursor-default`}
                aria-current={active ? "step" : undefined}
              >
                {t("form.stepLabel", { current: step.id, total: steps.length })}
                <span className="mt-0.5 block font-medium">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      ) : null}

      <PageToast message={errorMessage ?? null} tone="error" />

      {show(1) ? (
        <FormSection
          layout={layout}
          id="deposit-account-section-1"
          title={t("form.stepProduct")}
        >
        <div className="flex flex-col gap-4">
          {locked ? <p className="text-xs text-muted">{t("form.lockedHint")}</p> : null}
          <fieldset disabled={locked} aria-describedby="deposit-product-error">
            <legend className="mb-2 text-xs font-semibold text-slate-600">
              {t("form.productType")}
              <span className="text-rose-600" aria-hidden="true"> *</span>
            </legend>
            {productsLoading ? (
              <p className="text-sm text-muted">{tUi("loading")}</p>
            ) : productsError ? (
              <Alert tone="error">
                {isTerm ? t("form.term.productsError") : t("form.productsError")}
              </Alert>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted">
                {isTerm ? t("form.term.productsEmpty") : t("form.productsEmpty")}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {products.map((product) => {
                  const checked = form.prodTypeCd === String(product.prodTypeCd);
                  const empty = product.schemes.length === 0;
                  return (
                    <label
                      key={product.prodTypeCd}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-sm ${
                        checked
                          ? "border-brand bg-brand-soft text-brand-ink"
                          : "border-border bg-surface text-slate-800"
                      } ${empty && !checked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    >
                      <input autoComplete="off"
                        type="radio"
                        name="product-type"
                        className="mt-1"
                        checked={checked}
                        disabled={empty && !checked}
                        onChange={() => selectProduct(product)}
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold">{product.prodTypeDesc}</span>
                        <span className="block text-xs text-muted">
                          {empty
                            ? t("form.noActiveScheme")
                            : t("form.schemeCount", { count: product.schemes.length })}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            {fieldErrors.prodTypeCd ? (
              <p id="deposit-product-error" className="mt-2 text-xs text-rose-600" role="alert">
                {fieldErrors.prodTypeCd}
              </p>
            ) : null}
          </fieldset>
          <SelectField
            label={t("form.scheme")}
            required
            disabled={locked || !form.prodTypeCd}
            value={form.schemeId}
            error={fieldErrors.schemeId}
            placeholder={
              isTerm ? t("form.term.schemePlaceholder") : t("form.schemePlaceholder")
            }
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            hint={form.prodTypeCd ? undefined : t("form.schemeHint")}
            onChange={selectScheme}
            options={schemeOptions}
          />
          {selectedScheme ? (
            <dl className="grid gap-2 rounded-xl border border-border bg-surface-muted p-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold text-slate-600">{t("form.schemeInterest")}</dt>
                <dd className="text-slate-800">
                  {[selectedScheme.inttTypeDesc, selectedScheme.inttPayoutDesc]
                    .filter(Boolean)
                    .join(" · ") || t("dash")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-600">{t("form.schemeMinBalance")}</dt>
                <dd className="tabular-nums text-slate-800">
                  {selectedScheme.minBalance != null
                    ? format.number(selectedScheme.minBalance, {
                        style: "currency",
                        currency: "INR",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : t("dash")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-600">{t("form.schemeWithdrawal")}</dt>
                <dd className="text-slate-800">
                  {selectedScheme.withdAllow
                    ? t("form.withdrawalAllowed")
                    : t("form.withdrawalBlocked")}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
        </FormSection>
      ) : null}

      {show(2) ? (
        <FormSection
          layout={layout}
          id="deposit-account-section-2"
          title={t("form.stepCustomer")}
        >
        <div className="flex flex-col gap-4">
          {requiredCustType == null && form.prodTypeCd ? (
          <fieldset disabled={locked}>
            <legend className="mb-2 text-xs font-semibold text-slate-600">
              {t("form.customerType")}
            </legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {(custTypes.length > 0
                ? [...custTypes].sort((left, right) => right.optCode - left.optCode)
                : [
                    { optCode: CUST_TYPE_INDIVIDUAL, optDescription: t("form.individual") },
                    { optCode: CUST_TYPE_GROUP, optDescription: t("form.group") },
                  ]
              ).map((option) => (
                <label
                  key={option.optCode}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-800"
                >
                  <input autoComplete="off"
                    type="radio"
                    name="customer-type"
                    checked={form.custTypeCd === option.optCode}
                    onChange={() => selectCustType(option.optCode)}
                  />
                  {option.optDescription}
                </label>
              ))}
            </div>
          </fieldset>
          ) : (
            <p className="text-xs text-muted">
              {form.prodTypeCd
                ? t("form.customerTypeFixed", {
                    type:
                      form.custTypeCd === CUST_TYPE_GROUP
                        ? t("form.group")
                        : t("form.individual"),
                  })
                : t("form.customerAfterProduct")}
            </p>
          )}
          {locked ? <p className="text-xs text-muted">{t("form.lockedHint")}</p> : null}
          <DepositAccountCustomerPicker
            kind={form.custTypeCd === CUST_TYPE_GROUP ? "group" : "member"}
            label={t("form.customer")}
            customer={form.customer}
            disabled={locked || !form.prodTypeCd}
            error={fieldErrors.custIdPrimary}
            onChange={selectCustomer}
          />
          {form.customer ? (
            <dl className="grid gap-2 rounded-xl border border-border bg-surface-muted p-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold text-slate-600">
                  {t("form.customerCardBranch")}
                </dt>
                <dd className="text-slate-800">
                  {form.customer.branchName || t("dash")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-600">
                  {t("form.customerCardFo")}
                </dt>
                <dd className="text-slate-800">{form.customer.foName || t("dash")}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-600">
                  {form.custTypeCd === CUST_TYPE_GROUP
                    ? t("form.formationDate")
                    : t("form.joiningDate")}
                </dt>
                <dd className="text-slate-800">{anchorLabel}</dd>
              </div>
            </dl>
          ) : null}
        </div>
        </FormSection>
      ) : null}

      {show(3) ? (
        <div
          id={layout === "page" ? "deposit-account-section-3" : undefined}
          className="flex flex-col gap-5"
        >
        <FormSection
          layout={layout}
          id="deposit-account-holders"
          title={t("form.stepHolders")}
        >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label={t("form.operationMode")}
            required
            value={form.opModeCd}
            error={fieldErrors.opModeCd}
            placeholder={t("form.operationMode")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={selectMode}
            options={opModes.map((option) => ({
              value: String(option.optCode),
              label: option.optDescription,
              disabled: !isOpModeAllowed(form.custTypeCd, option.optCode),
            }))}
          />
          <SelectField
            label={t("form.specialCategory")}
            value={form.specialCatgCd}
            error={fieldErrors.specialCatgCd}
            placeholder={t("form.specialCategory")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(specialCatgCd) => patch({ specialCatgCd })}
            options={categories.map((option) => {
              const seniorBlocked =
                option.optCode === SPECIAL_SENIOR && age != null && age < 60;
              return {
                value: String(option.optCode),
                label: seniorBlocked
                  ? `${option.optDescription} · ${t("form.seniorHint")}`
                  : option.optDescription,
                disabled: !isSpecialAllowed(
                  form.custTypeCd,
                  option.optCode,
                  age,
                ),
              };
            })}
          />
          </div>
          {joints.joint1 ? (
            <DepositAccountCustomerPicker
              kind="member"
              label={t("form.joint1")}
              required
              customer={form.joint1}
              excludeIds={[form.customer?.id, form.joint2?.id].filter(
                (id): id is number => id != null,
              )}
              error={fieldErrors.custIdJoint1}
              onChange={(joint1) => {
                patch({
                  joint1,
                  joint2:
                    joint1 && form.joint2?.id === joint1.id ? null : form.joint2,
                });
                setFieldErrors((current) => ({ ...current, custIdJoint1: "" }));
              }}
            />
          ) : null}
          {joints.joint2 ? (
            <DepositAccountCustomerPicker
              kind="member"
              label={t("form.joint2")}
              required={joints.joint2Required}
              customer={form.joint2}
              excludeIds={[form.customer?.id, form.joint1?.id].filter(
                (id): id is number => id != null,
              )}
              error={fieldErrors.custIdJoint2}
              onChange={(joint2) => {
                patch({ joint2 });
                setFieldErrors((current) => ({ ...current, custIdJoint2: "" }));
              }}
            />
          ) : null}
          <TextField
            label={t("form.holderName")}
            value={shownHolder}
            maxLength={300}
            error={fieldErrors.holderName}
            hint={t("form.holderNameHint")}
            onChange={(holderName) =>
              patch({ holderName, holderNameManual: holderName.trim() !== "" })
            }
          />
        </div>
        </FormSection>
        </div>
      ) : null}

      {show(4) ? (
        <FormSection
          layout={layout}
          id="deposit-account-section-4"
          title={detailsStepLabel}
        >
          {isTerm ? (
            <DepositAccountTermDetails
              draft={form.term}
              prodTypeCd={prodTypeCd}
              applDate={form.applDate}
              schemeRoi={selectedScheme?.roiPercent ?? null}
              maturityOptions={maturityOptions}
              sbAccountOptions={sbAccountOptions}
              sbAccountsLoading={sbAccountsLoading}
              errors={fieldErrors}
              onChange={patchTerm}
            />
          ) : (
            <SavingsDetails
              form={form}
              locked={sbLocked}
              showAccountNo={mode === "edit"}
              scheme={selectedScheme}
              paymentModes={paymentModes}
              errors={fieldErrors}
              onChange={patch}
            />
          )}
        </FormSection>
      ) : null}

      {show(5) ? (
        <FormSection
          layout={layout}
          id="deposit-account-section-5"
          title={t("form.stepApplication")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
          <DateField
            label={t("form.applDate")}
            required
            value={form.applDate}
            min={form.customer?.anchorDate || undefined}
            max={todayYmd()}
            error={fieldErrors.applDate}
            onChange={(applDate) => patch({ applDate })}
          />
          <SelectField
            label={t("form.branch")}
            required
            value={effectiveBranchId != null ? String(effectiveBranchId) : ""}
            error={fieldErrors.branchId}
            placeholder={t("form.branchPlaceholder")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            disabled={locked}
            onChange={(branchId) => {
              patch({
                branchId,
                foId: "",
              });
              setFieldErrors((current) => ({ ...current, branchId: "" }));
            }}
            options={branchOptions}
          />
          <SelectField
            label={t("form.fieldOfficer")}
            value={form.foId}
            error={fieldErrors.foId}
            placeholder={t("form.fieldOfficerPlaceholder")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            disabled={effectiveBranchId == null}
            onChange={(foId) => patch({ foId })}
            options={[{ value: "", label: t("form.fieldOfficerPlaceholder") }, ...officers]}
          />
          {mode === "create" ? (
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-xs font-semibold text-slate-600">
                {t("form.initialStatus")}
              </legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {(statuses.some((option) => option.optCode === STATUS_ACTIVE || option.optCode === STATUS_KYC_PENDING)
                  ? statuses
                      .filter(
                        (option) =>
                          option.optCode === STATUS_ACTIVE ||
                          option.optCode === STATUS_KYC_PENDING,
                      )
                      .sort((left, right) => left.optCode - right.optCode)
                  : [
                      { optCode: STATUS_ACTIVE, optDescription: t("form.active") },
                      { optCode: STATUS_KYC_PENDING, optDescription: t("form.kycPending") },
                    ]
                ).map((option) => (
                  <label
                    key={option.optCode}
                    className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-800"
                  >
                    <input autoComplete="off"
                      type="radio"
                      name="initial-status"
                      checked={form.statusCd === String(option.optCode)}
                      onChange={() =>
                        patch({
                          statusCd: String(option.optCode),
                          statusTouched: true,
                        })
                      }
                    />
                    {option.optDescription}
                  </label>
                ))}
              </div>
              {(form.customer?.kycPendingCount ?? 0) > 0 ? (
                <p className="mt-2 text-xs text-muted">{t("form.kycSuggest")}</p>
              ) : null}
            </fieldset>
          ) : null}
          </div>
        </FormSection>
      ) : null}

      {show(6) ? (
        <FormSection
          layout={layout}
          id="deposit-account-section-6"
          title={t("form.stepNominees")}
        >
        {form.custTypeCd === CUST_TYPE_INDIVIDUAL ? (
          <CheckboxField
            label={t("form.nominee")}
            checked={form.nomRegd}
            onChange={(nomRegd) => {
              patch({ nomRegd });
              if (nomRegd) {
                setNomineesLoading(Boolean(form.customer?.id));
                setNomineesListError(null);
                return;
              }
              setListedNominees([]);
              setNomineesListError(null);
              setNomineesLoading(false);
            }}
          />
        ) : null}
        {form.custTypeCd === CUST_TYPE_INDIVIDUAL &&
        form.nomRegd &&
        (nomineesLoading || nomineesListError || listedNominees.length > 0) ? (
          <RegisteredNomineeList
            nominees={listedNominees}
            loading={nomineesLoading}
            error={nomineesListError}
          />
        ) : (
        <DepositAccountNomineeStep
          drafts={nominees}
          holderIds={[form.customer?.id, form.joint1?.id, form.joint2?.id].filter(
            (id): id is number => id != null,
          )}
          reservedShare={0}
          reservedCount={0}
          onDeactivate={(nomineeId) => {
            setDeactivateIds((ids) =>
              ids.includes(nomineeId) ? ids : [...ids, nomineeId],
            );
            setNominees((rows) => rows.filter((row) => row.nomineeId !== nomineeId));
          }}
          groupAccount={form.custTypeCd === CUST_TYPE_GROUP}
          relations={relations}
          branchId={effectiveBranchId}
          errors={fieldErrors}
          onChange={setNominees}
        />
        )}
        </FormSection>
      ) : null}

      {show(7) ? (
        <FormSection
          layout={layout}
          id="deposit-account-section-7"
          title={t("form.stepSignatories")}
        >
          <DepositAccountSignatoryStep
            drafts={signatories}
            mode={signatoryPickerMode(form.custTypeCd, Number(form.opModeCd) || 0)}
            holders={[form.customer, form.joint1, form.joint2].filter(
              (holder): holder is DepositCustomer => holder != null,
            )}
            groupId={
              form.custTypeCd === CUST_TYPE_GROUP ? (form.customer?.id ?? null) : null
            }
            branchId={effectiveBranchId}
            authorisedEmpty={
              Number(form.opModeCd) === OP_MODE_SIGNATORY && signatories.length === 0
            }
            errors={fieldErrors}
            onChange={setSignatories}
            onDeactivate={(signatoryId) => {
              setSignatoryDeactivateIds((ids) =>
                ids.includes(signatoryId) ? ids : [...ids, signatoryId],
              );
              setSignatories((rows) =>
                rows.filter((row) => row.signatoryId !== signatoryId),
              );
            }}
          />
        </FormSection>
      ) : null}

      {show(8) ? (
        <FormSection
          layout={layout}
          id="deposit-account-section-8"
          title={t("form.stepSummary")}
          collapsible
        >
        <DepositAccountSummaryStep sections={summarySections} />
        </FormSection>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          {t("form.cancel")}
        </Button>
        {layout === "dialog" && form.step > 1 ? (
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => patch({ step: (form.step - 1) as Step })}
          >
            {t("form.back")}
          </Button>
        ) : null}
        {layout === "dialog" && form.step < LAST_STEP ? (
          <Button type="button" icon={ArrowRight} onClick={goNext}>
            {t("form.next")}
          </Button>
        ) : (
          <Button type="button" icon={Save} loading={saving} onClick={saveAccount}>
            {saving ? t("form.saving") : t("form.submit")}
          </Button>
        )}
      </div>
    </form>
  );
}

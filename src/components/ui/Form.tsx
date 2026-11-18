"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";

/** @deprecated Use `controlClass` from `@/components/ui/Input`. */
export { controlClass as formControlClass } from "@/components/ui/Input";
/** @deprecated Prefer `Select` — kept for rare native select needs. */
export const formSelectClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:1rem] bg-[right_0.875rem_center] bg-no-repeat pr-10 hover:border-border-strong focus:border-brand focus:bg-surface focus:shadow-[var(--focus-ring)]";

export type FieldRestrict = "digits" | "phone" | "code" | "decimal";

type FormFieldProps = {
  label: string;
  hideLabel?: boolean;
  children: ReactNode;
  className?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  meta?: ReactNode;
};

/** Label + control + live hint, error, and limit counter. */
export function FormField({
  label,
  hideLabel = false,
  children,
  className = "",
  required,
  error,
  hint,
  meta,
}: FormFieldProps) {
  return (
    <div className={`block ${className}`}>
      <span className={hideLabel ? "sr-only" : "mb-1.5 block text-xs font-semibold text-slate-600"}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-600" role="alert">
          {error}
        </span>
      ) : null}
      {hint || meta ? (
        <span className="mt-1 flex items-start justify-between gap-3 text-xs text-muted">
          <span className="min-w-0">{hint}</span>
          {meta ? <span className="shrink-0 tabular-nums">{meta}</span> : null}
        </span>
      ) : null}
    </div>
  );
}

function limitValue(
  value: string,
  restrict: FieldRestrict | undefined,
  maxLength: number | undefined,
) {
  let next = value;
  if (restrict === "digits") next = next.replace(/\D/g, "");
  if (restrict === "phone") {
    next = next.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  }
  if (restrict === "code") next = next.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (restrict === "decimal") {
    next = next.replace(/[^\d.-]/g, "").replace(/(?!^)-/g, "");
    const [whole, ...rest] = next.split(".");
    next = rest.length > 0 ? `${whole}.${rest.join("")}` : whole;
  }
  if (maxLength != null && maxLength > 0) next = next.slice(0, maxLength);
  return next;
}

type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "className"
> & {
  label: string;
  value: string | number;
  onChange?: (value: string) => void;
  error?: string;
  hint?: string;
  className?: string;
  inputClassName?: string;
  trailing?: ReactNode;
  /** Strip disallowed characters as the user types. */
  restrict?: FieldRestrict;
  /** Checked while typing and again when the field is left. */
  validate?: (value: string, final: boolean) => string | undefined;
  /** Number fields show min–max under the input unless this is false. */
  showRange?: boolean;
};

export function TextField({
  label,
  value,
  onChange,
  required,
  error,
  hint,
  className,
  readOnly,
  inputClassName = "",
  trailing,
  restrict,
  validate,
  showRange = true,
  ...rest
}: TextFieldProps) {
  const t = useTranslations("ui");
  const [touched, setTouched] = useState(false);
  const [liveError, setLiveError] = useState<string | undefined>();
  const maxLength =
    typeof rest.maxLength === "number" ? rest.maxLength : undefined;
  const min = rest.min;
  const max = rest.max;
  const type = rest.type;
  const inputMode = rest.inputMode;
  const isDecimal =
    inputMode === "decimal" ||
    (type === "number" &&
      (rest.step === "any" ||
        rest.step == null ||
        (typeof rest.step === "string" && rest.step.includes(".")) ||
        (typeof rest.step === "number" && !Number.isInteger(rest.step))));

  const activeRestrict: FieldRestrict | undefined =
    restrict ??
    (inputMode === "numeric" || inputMode === "decimal"
      ? isDecimal
        ? "decimal"
        : "digits"
      : type === "tel"
        ? "phone"
        : type === "number"
          ? isDecimal
            ? "decimal"
            : "digits"
          : undefined);

  const textValue = String(value ?? "");
  const shownError = error || (touched ? liveError : undefined);

  function check(next: string, final: boolean) {
    if (type === "number" && next !== "") {
      const amount = Number(next);
      if (max != null && amount > Number(max)) {
        return t("numberMax", { max: String(max) });
      }
      if (final && min != null && amount < Number(min)) {
        return t("numberMin", { min: String(min) });
      }
    }
    return validate?.(next, final);
  }

  function commit(next: string, final: boolean) {
    setTouched(true);
    setLiveError(check(next, final));
    onChange?.(next);
  }

  const rangeLabel =
    showRange && type === "number" && min != null && max != null
      ? t("numberRange", { min: String(min), max: String(max) })
      : null;

  if (type === "date" || type === "time") {
    const pickerLabel =
      typeof rest["aria-label"] === "string" ? rest["aria-label"] : label;
    return (
      <FormField
        label={label}
        required={required}
        error={shownError}
        hint={hint}
        className={className}
      >
        {type === "date" ? (
          <DatePicker
            id={typeof rest.id === "string" ? rest.id : undefined}
            value={textValue}
            disabled={Boolean(rest.disabled)}
            min={typeof rest.min === "string" ? rest.min : undefined}
            max={typeof rest.max === "string" ? rest.max : undefined}
            onChange={(next) => commit(next, true)}
            aria-label={pickerLabel}
            aria-invalid={shownError ? true : undefined}
          />
        ) : (
          <TimePicker
            id={typeof rest.id === "string" ? rest.id : undefined}
            value={textValue}
            disabled={Boolean(rest.disabled)}
            onChange={(next) => commit(next, true)}
            aria-label={pickerLabel}
            aria-invalid={shownError ? true : undefined}
          />
        )}
      </FormField>
    );
  }

  return (
    <FormField
      label={label}
      required={required}
      error={shownError}
      hint={hint}
      className={className}
      meta={rangeLabel}
    >
      <div className={trailing ? "relative" : undefined}>
        <Input
          {...rest}
          value={value}
          readOnly={readOnly}
          aria-required={required || undefined}
          onBlur={(event) => {
            rest.onBlur?.(event);
            if (readOnly) return;
            setTouched(true);
            setLiveError(check(textValue, true));
          }}
          onChange={
            readOnly || !onChange
              ? undefined
              : (event) => {
                  const next = limitValue(
                    event.target.value,
                    activeRestrict,
                    maxLength,
                  );
                  commit(next, false);
                }
          }
          className={`${trailing ? "pe-11" : ""} ${inputClassName}`.trim()}
          aria-invalid={shownError ? true : undefined}
        />
        {trailing ? (
          <div className="absolute inset-y-0 end-2 flex items-center">
            {trailing}
          </div>
        ) : null}
      </div>
    </FormField>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  rows?: number;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  validate?: (value: string, final: boolean) => string | undefined;
};

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  hint,
  rows = 3,
  disabled,
  maxLength,
  className,
  validate,
}: TextAreaFieldProps) {
  const [touched, setTouched] = useState(false);
  const [liveError, setLiveError] = useState<string | undefined>();
  const shownError = error || (touched ? liveError : undefined);

  return (
    <FormField
      label={label}
      required={required}
      error={shownError}
      hint={hint}
      className={className}
    >
      <Textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        aria-required={required || undefined}
        onBlur={() => {
          setTouched(true);
          setLiveError(validate?.(value, true));
        }}
        onChange={(event) => {
          const next = maxLength
            ? event.target.value.slice(0, maxLength)
            : event.target.value;
          setTouched(true);
          setLiveError(validate?.(next, false));
          onChange(next);
        }}
        aria-invalid={shownError ? true : undefined}
      />
    </FormField>
  );
}

type SelectFieldProps = {
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

export function SelectField({
  label,
  hideLabel,
  value,
  onChange,
  options,
  placeholder,
  required,
  error,
  hint,
  disabled,
  searchable,
  searchPlaceholder,
  emptyMessage,
}: SelectFieldProps) {
  return (
    <FormField label={label} hideLabel={hideLabel} required={required} error={error} hint={hint}>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        aria-label={label}
        aria-invalid={error ? true : undefined}
      />
    </FormField>
  );
}

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
};

export function DateField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  hint,
  disabled,
  min,
  max,
}: DateFieldProps) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <DatePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        aria-label={label}
        aria-invalid={error ? true : undefined}
      />
    </FormField>
  );
}

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export function CheckboxField({
  label,
  checked,
  onChange,
  className,
}: CheckboxFieldProps) {
  return (
    <Checkbox
      label={label}
      checked={checked}
      onChange={onChange}
      variant="box"
      className={className}
    />
  );
}

type CheckRowProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function CheckRow({ label, checked, onChange }: CheckRowProps) {
  return (
    <Checkbox
      label={label}
      checked={checked}
      onChange={onChange}
      variant="row"
    />
  );
}

import type { InputHTMLAttributes, ReactNode } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";

/** @deprecated Use `controlClass` from `@/components/ui/Input`. */
export { controlClass as formControlClass } from "@/components/ui/Input";
/** @deprecated Prefer `Select` — kept for rare native select needs. */
export const formSelectClass =
  "w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-slate-800 outline-none transition appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:1rem] bg-[right_0.875rem_center] bg-no-repeat pr-10 hover:border-slate-300 focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10";

type FormFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  error?: string;
  hint?: string;
};

/** Label + control + optional error/hint wrapper. */
export function FormField({
  label,
  children,
  className = "",
  required,
  error,
  hint,
}: FormFieldProps) {
  return (
    <div className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : null}
      {!error && hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  );
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
  inputClassName?: string;
};

export function TextField({
  label,
  value,
  onChange,
  required,
  error,
  hint,
  readOnly,
  inputClassName = "",
  ...rest
}: TextFieldProps) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <Input
        {...rest}
        value={value}
        required={required}
        readOnly={readOnly}
        onChange={
          readOnly || !onChange
            ? undefined
            : (event) => onChange(event.target.value)
        }
        className={inputClassName}
        aria-invalid={error ? true : undefined}
      />
    </FormField>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  rows?: number;
  disabled?: boolean;
};

export function TextAreaField({
  label,
  value,
  onChange,
  required,
  error,
  hint,
  rows = 3,
  disabled,
}: TextAreaFieldProps) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <Textarea
        rows={rows}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
      />
    </FormField>
  );
}

type SelectFieldProps = {
  label: string;
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
    <FormField label={label} required={required} error={error} hint={hint}>
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

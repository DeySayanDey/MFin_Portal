import type { TextareaHTMLAttributes } from "react";
import { controlClass } from "@/components/ui/Input";

type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
> & {
  className?: string;
};

export function Textarea({
  className = "",
  rows = 3,
  ...props
}: TextareaProps) {
  return (
    <textarea
      {...props}
      rows={rows}
      className={`${controlClass} resize-y ${className}`.trim()}
    />
  );
}

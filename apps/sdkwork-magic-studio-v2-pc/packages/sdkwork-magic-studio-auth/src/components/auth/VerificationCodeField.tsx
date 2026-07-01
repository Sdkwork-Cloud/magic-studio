import { Button } from '@sdkwork/ui-pc-react/components/ui/actions';
import { Input, Label } from '@sdkwork/ui-pc-react/components/ui/data-entry';

interface VerificationCodeFieldProps {
  actionLabel: string;
  autoComplete?: string;
  disabled?: boolean;
  isCoolingDown?: boolean;
  isSending?: boolean;
  label: string;
  onAction: () => void;
  onChange: (value: string) => void;
  placeholder: string;
  remainingSeconds?: number;
  required?: boolean;
  resendLabel: string;
  value: string;
}

export function VerificationCodeField({
  actionLabel,
  autoComplete = 'one-time-code',
  disabled = false,
  isCoolingDown = false,
  isSending = false,
  label,
  onAction,
  onChange,
  placeholder,
  remainingSeconds = 0,
  required = true,
  resendLabel,
  value,
}: VerificationCodeFieldProps) {
  const actionText = isCoolingDown
    ? `${resendLabel} (${remainingSeconds}s)`
    : actionLabel;

  return (
    <div className="space-y-2">
      <Label className="text-zinc-700 dark:text-zinc-300">{label}</Label>
      <div className="flex gap-3">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11"
          autoComplete={autoComplete}
          required={required}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isSending || isCoolingDown}
          loading={isSending}
          onClick={onAction}
          className="h-11 min-w-[132px] shrink-0 font-semibold"
        >
          {actionText}
        </Button>
      </div>
    </div>
  );
}

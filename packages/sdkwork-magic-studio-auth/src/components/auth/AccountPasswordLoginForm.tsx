import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Lock, UserCircle2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import { sdkToast } from '@sdkwork/ui-pc-react/components/ui/feedback';
import { Button } from '@sdkwork/ui-pc-react/components/ui/actions';
import { Input, Label } from '@sdkwork/ui-pc-react/components/ui/data-entry';
import { readErrorMessage } from './authConfig';

interface AccountPasswordLoginFormProps {
  initialAccount?: string;
  onSubmit: (payload: { account: string; password: string }) => Promise<void>;
}

export function AccountPasswordLoginForm({
  initialAccount,
  onSubmit,
}: AccountPasswordLoginFormProps) {
  const { t } = useTranslation();
  const [account, setAccount] = useState(initialAccount || '');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAccount(initialAccount || '');
  }, [initialAccount]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        account: account.trim(),
        password,
      });
    } catch (error) {
      sdkToast.error(readErrorMessage(error, t('auth.errors.signInFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-zinc-700 dark:text-zinc-300">{t('auth.account')}</Label>
        <div className="relative">
          <UserCircle2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder={t('auth.placeholders.account')}
            className="h-11 pl-10"
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-700 dark:text-zinc-300">{t('auth.password')}</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('auth.placeholders.password')}
            className="h-11 pl-10"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      <Button type="submit" loading={isSubmitting} className="h-11 w-full font-bold">
        {t('auth.signIn')}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

import { Link } from "react-router";
import { Field } from "../../../common/ui/components/Field";
import { bg, formErrorMessage } from "../assets/copy";
import { AuthFormShell } from "../components/AuthFormShell";
import { FailureAlert } from "../components/FailureAlert";
import { SubmitButton } from "../components/SubmitButton";
import { useAuthSubmission } from "../components/useAuthSubmission";

interface Props {
  mode: "reset" | "set";
  token?: string;
  onConsumeLink: () => void;
}

export function ResetPasswordPage({ mode, token, onConsumeLink }: Props) {
  const form = useAuthSubmission({ mode, token, onConsumeLink });

  return (
    <AuthFormShell mode={mode} done={form.done} missingLink={!token}>
      <form
        ref={form.formRef}
        className="stack"
        noValidate
        onSubmit={form.submit}
        aria-busy={form.pending}
      >
        <Field
          id="password"
          name="password"
          label={bg.password}
          type="password"
          autoComplete="new-password"
          required
          value={form.values.password}
          onChange={(event) => form.setValue("password", event.target.value)}
          hint={bg.policy}
          error={formErrorMessage(form.errors.password)}
          disabled={form.locked}
        />
        <Field
          id="confirm"
          name="confirm"
          label={bg.confirm}
          type="password"
          autoComplete="new-password"
          required
          value={form.values.confirm}
          onChange={(event) => form.setValue("confirm", event.target.value)}
          error={formErrorMessage(form.errors.confirm)}
          disabled={form.locked}
        />
        {form.failure && <FailureAlert failure={form.failure} />}
        <SubmitButton pending={form.pending} disabled={form.locked}>
          {bg.save}
        </SubmitButton>
        <Link className="btn" to="/login">
          {bg.back}
        </Link>
        {form.failure?.terminal && (
          <Link className="btn" to="/forgot-password">
            {bg.newLink}
          </Link>
        )}
      </form>
    </AuthFormShell>
  );
}

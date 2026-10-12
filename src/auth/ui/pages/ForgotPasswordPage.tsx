import { Link } from "react-router";
import { Field } from "../../../common/ui/components/Field";
import { bg, formErrorMessage } from "../assets/copy";
import { AuthFormShell } from "../components/AuthFormShell";
import { FailureAlert } from "../components/FailureAlert";
import { SubmitButton } from "../components/SubmitButton";
import { useAuthSubmission } from "../components/useAuthSubmission";

export function ForgotPasswordPage() {
  const form = useAuthSubmission({ mode: "forgot" });

  return (
    <AuthFormShell mode="forgot" done={form.done}>
      <form
        ref={form.formRef}
        className="stack"
        noValidate
        onSubmit={form.submit}
        aria-busy={form.pending}
      >
        <Field
          id="email"
          name="email"
          label={bg.email}
          type="email"
          autoComplete="email"
          placeholder={bg.emailPlaceholder}
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          value={form.values.email}
          onChange={(event) => form.setValue("email", event.target.value)}
          error={formErrorMessage(form.errors.email)}
          disabled={form.pending}
        />
        {form.failure && <FailureAlert failure={form.failure} />}
        <SubmitButton pending={form.pending} disabled={form.locked}>
          {bg.send}
        </SubmitButton>
        <Link className="btn" to="/login">
          {bg.back}
        </Link>
      </form>
    </AuthFormShell>
  );
}

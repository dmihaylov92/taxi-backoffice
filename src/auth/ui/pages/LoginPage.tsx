import { Link } from "react-router";
import { Field } from "../../../common/ui/components/Field";
import { bg, formErrorMessage } from "../assets/copy";
import { AuthFormShell } from "../components/AuthFormShell";
import { FailureAlert } from "../components/FailureAlert";
import { SubmitButton } from "../components/SubmitButton";
import { useAuthSession } from "../components/useAuthSession";
import { useAuthSubmission } from "../components/useAuthSubmission";

export function LoginPage() {
  const { notice } = useAuthSession();
  const form = useAuthSubmission({ mode: "login" });

  return (
    <AuthFormShell mode="login" done={form.done}>
      {notice && (
        <p className="banner" role="status">
          {notice}
        </p>
      )}
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
        <Field
          id="password"
          name="password"
          label={bg.password}
          type="password"
          autoComplete="current-password"
          required
          value={form.values.password}
          onChange={(event) => form.setValue("password", event.target.value)}
          error={formErrorMessage(form.errors.password)}
          disabled={form.locked}
        />
        {form.failure && <FailureAlert failure={form.failure} />}
        <div className="login-options">
          <span className="hint">{bg.rememberSession}</span>
          <Link to="/forgot-password">{bg.forgotLink}</Link>
        </div>
        <SubmitButton pending={form.pending} disabled={form.locked}>
          {bg.login}
          <span aria-hidden="true">→</span>
        </SubmitButton>
      </form>
    </AuthFormShell>
  );
}

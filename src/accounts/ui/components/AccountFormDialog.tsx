import { ROLES, type Role } from "../../../common/domain/models/Role";
import { useState, type FormEvent } from "react";
import { Field } from "../../../common/ui/components/Field";
import { Modal } from "../../../common/ui/components/Modal";
import { useApiAction } from "../../../common/ui/hooks/useApiAction";
import { PendingButton } from "../../../common/ui/components/PendingButton";
import {
  ACCOUNT_STATUSES,
  type AccountStatus,
} from "../../domain/models/Account";
import type {
  AccountDraft,
  DraftErrors,
  DraftField,
} from "../../domain/models/AccountDraft";
import {
  hasErrors,
  validateDraft,
} from "../../domain/services/AccountValidationService";
import {
  accountFailureText,
  accountsCopy,
  draftErrorText,
} from "../assets/copy";
import { RoleBadge, StatusBadge } from "./Badges";

interface AccountFormDialogProps {
  mode: "create" | "edit";
  initial: AccountDraft;
  /** Rejects when the API does not confirm the change; the dialog stays open and shows why. */
  onSubmit: (draft: AccountDraft) => Promise<void>;
  onClose: () => void;
  onUnauthenticated: () => void;
}

type Step = 0 | 1 | 2;

const STEP_FIELDS: Record<Step, readonly DraftField[]> = {
  0: ["email", "firstName", "lastName"],
  1: ["roles"],
  2: [],
};

const ALL_FIELDS: readonly DraftField[] = [
  "email",
  "firstName",
  "lastName",
  "roles",
];

const FIELD_IDS: Record<DraftField, string> = {
  email: "account-email",
  firstName: "account-first-name",
  lastName: "account-last-name",
  roles: "account-role-ADMIN",
};

function focusFirstError(errors: DraftErrors, order: readonly DraftField[]) {
  const field = order.find((candidate) => errors[candidate]);

  if (field) {
    document.getElementById(FIELD_IDS[field])?.focus();
  }
}

function submitLabel(creating: boolean, step: Step): string {
  if (!creating) {
    return accountsCopy.edit.submit;
  }

  return step < 2 ? accountsCopy.continue : accountsCopy.create.submit;
}

export function AccountFormDialog({
  mode,
  initial,
  onSubmit,
  onClose,
  onUnauthenticated,
}: AccountFormDialogProps) {
  const [draft, setDraft] = useState(initial);
  const [step, setStep] = useState<Step>(0);
  const [errors, setErrors] = useState<DraftErrors>({});
  const action = useApiAction(onUnauthenticated);
  const creating = mode === "create";
  const title = creating ? accountsCopy.create.title : accountsCopy.edit.title;

  function update(patch: Partial<AccountDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function toggleRole(role: Role) {
    update({
      roles: draft.roles.includes(role)
        ? draft.roles.filter((current) => current !== role)
        : [...draft.roles, role],
    });
  }

  function check(fields: readonly DraftField[]): boolean {
    const found = validateDraft(draft, fields);

    setErrors(found);
    focusFirstError(found, fields);

    return !hasErrors(found);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (action.pending) {
      return;
    }

    if (creating && step < 2) {
      if (check(STEP_FIELDS[step])) {
        setStep((step + 1) as Step);
      }

      return;
    }

    if (check(ALL_FIELDS)) {
      await action.run(() => onSubmit(draft));
    }
  }

  const failureMessage = action.failure
    ? accountFailureText[action.failure.kind]
    : undefined;
  const showBasic = !creating || step === 0;
  const showRoles = !creating || step === 1;
  const showReview = creating && step === 2;

  return (
    <Modal title={title} onClose={onClose} busy={action.pending}>
      <form noValidate onSubmit={submit} aria-busy={action.pending}>
        <div className={`modal-body ${creating ? "with-steps" : ""}`}>
          {creating && (
            <ol className="steps" aria-label={accountsCopy.create.stepsLabel}>
              {accountsCopy.create.steps.map((label, index) => (
                <li
                  key={label}
                  aria-current={index === step ? "step" : undefined}
                  className={index < step ? "done" : undefined}
                >
                  <span className="step-mark" aria-hidden="true">
                    {index < step ? "✓" : index + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          )}
          <div className="modal-content">
            {creating && (
              <header className="step-head">
                <h3>
                  {
                    [
                      accountsCopy.create.basicTitle,
                      accountsCopy.create.rolesTitle,
                      accountsCopy.create.reviewTitle,
                    ][step]
                  }
                </h3>
                <p className="muted">
                  {
                    [
                      accountsCopy.create.basicSub,
                      accountsCopy.create.rolesSub,
                      accountsCopy.create.reviewSub,
                    ][step]
                  }
                </p>
              </header>
            )}

            {showBasic && (
              <div className="form-grid">
                <Field
                  id={FIELD_IDS.email}
                  name="email"
                  type="email"
                  label={`${accountsCopy.fields.email} *`}
                  placeholder={accountsCopy.fields.emailPlaceholder}
                  hint={creating ? accountsCopy.fields.emailHint : undefined}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={254}
                  required
                  disabled={action.pending}
                  value={draft.email}
                  error={errors.email && draftErrorText[errors.email]}
                  onChange={(event) => update({ email: event.target.value })}
                />
                <Field
                  id={FIELD_IDS.firstName}
                  name="firstName"
                  icon={false}
                  label={
                    creating
                      ? `${accountsCopy.fields.firstName} (${accountsCopy.fields.optional})`
                      : accountsCopy.fields.firstName
                  }
                  placeholder={accountsCopy.fields.firstNamePlaceholder}
                  autoComplete="off"
                  maxLength={100}
                  disabled={action.pending}
                  value={draft.firstName}
                  error={errors.firstName && draftErrorText[errors.firstName]}
                  onChange={(event) =>
                    update({ firstName: event.target.value })
                  }
                />
                <Field
                  id={FIELD_IDS.lastName}
                  name="lastName"
                  icon={false}
                  label={
                    creating
                      ? `${accountsCopy.fields.lastName} (${accountsCopy.fields.optional})`
                      : accountsCopy.fields.lastName
                  }
                  placeholder={accountsCopy.fields.lastNamePlaceholder}
                  autoComplete="off"
                  maxLength={100}
                  disabled={action.pending}
                  value={draft.lastName}
                  error={errors.lastName && draftErrorText[errors.lastName]}
                  onChange={(event) => update({ lastName: event.target.value })}
                />
              </div>
            )}

            {showRoles && (
              <div className="form-grid">
                <fieldset
                  className="choices"
                  aria-describedby={errors.roles ? "account-roles-error" : undefined}
                >
                  <legend>{`${accountsCopy.fields.roles} *`}</legend>
                  <div className="choice-grid">
                    {ROLES.map((role) => (
                      <label key={role} className="choice">
                        <input
                          id={`account-role-${role}`}
                          type="checkbox"
                          checked={draft.roles.includes(role)}
                          disabled={action.pending}
                          onChange={() => toggleRole(role)}
                        />
                        <span>
                          <strong>{accountsCopy.roles[role]}</strong>
                          <small>{accountsCopy.roleHints[role]}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.roles && (
                    <p className="error-text" id="account-roles-error">
                      {draftErrorText[errors.roles]}
                    </p>
                  )}
                </fieldset>
                <fieldset className="choices">
                  <legend>{`${accountsCopy.fields.status} *`}</legend>
                  <div className="choice-grid two">
                    {ACCOUNT_STATUSES.map((status: AccountStatus) => (
                      <label key={status} className="choice">
                        <input
                          type="radio"
                          name="status"
                          checked={draft.status === status}
                          disabled={action.pending}
                          onChange={() => update({ status })}
                        />
                        <span>
                          <strong>{accountsCopy.statuses[status]}</strong>
                          <small>{accountsCopy.statusHints[status]}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {showReview && (
              <dl className="review">
                <div>
                  <dt>{accountsCopy.fields.email}</dt>
                  <dd>{draft.email.trim()}</dd>
                </div>
                <div>
                  <dt>{accountsCopy.fields.firstName}</dt>
                  <dd>{draft.firstName.trim() || accountsCopy.review.none}</dd>
                </div>
                <div>
                  <dt>{accountsCopy.fields.lastName}</dt>
                  <dd>{draft.lastName.trim() || accountsCopy.review.none}</dd>
                </div>
                <div>
                  <dt>{accountsCopy.fields.roles}</dt>
                  <dd className="badge-row">
                    {ROLES.filter((role) =>
                      draft.roles.includes(role),
                    ).map((role) => (
                      <RoleBadge key={role} role={role} />
                    ))}
                  </dd>
                </div>
                <div>
                  <dt>{accountsCopy.fields.status}</dt>
                  <dd>
                    <StatusBadge status={draft.status} />
                  </dd>
                </div>
              </dl>
            )}

            {failureMessage && (
              <p className="banner error" role="alert">
                {failureMessage}
              </p>
            )}
          </div>
        </div>
        <footer className="modal-foot">
          <button
            type="button"
            className="btn"
            disabled={action.pending}
            onClick={onClose}
          >
            {accountsCopy.cancel}
          </button>
          {creating && step > 0 && (
            <button
              type="button"
              className="btn"
              disabled={action.pending}
              onClick={() => setStep((step - 1) as Step)}
            >
              {accountsCopy.back}
            </button>
          )}
          <PendingButton
            type="submit"
            className="btn primary"
            pending={action.pending}
            pendingLabel={accountsCopy.pending}
          >
            {submitLabel(creating, step)}
          </PendingButton>
        </footer>
      </form>
    </Modal>
  );
}

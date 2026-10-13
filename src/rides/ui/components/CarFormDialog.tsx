import { useState, type FormEvent } from "react";
import { Field } from "../../../common/ui/components/Field";
import { Modal } from "../../../common/ui/components/Modal";
import { PendingButton } from "../../../common/ui/components/PendingButton";
import { useApiAction } from "../../../common/ui/hooks/useApiAction";
import type {
  CarDraft,
  DraftErrors,
  DraftField,
} from "../../domain/models/CarDraft";
import {
  hasErrors,
  validateDraft,
} from "../../domain/services/CarValidationService";
import { carDraftErrorText, carFailureText, carsCopy } from "../assets/copy";

interface CarFormDialogProps {
  mode: "create" | "edit";
  initial: CarDraft;
  /** Rejects when the API does not confirm the change; the dialog stays open and shows why. */
  onSubmit: (draft: CarDraft) => Promise<void>;
  onClose: () => void;
  onUnauthenticated: () => void;
}

const FIELDS: readonly DraftField[] = [
  "plate",
  "make",
  "model",
  "vin",
  "mileageKm",
];

const FIELD_IDS: Record<DraftField, string> = {
  plate: "car-plate",
  make: "car-make",
  model: "car-model",
  vin: "car-vin",
  mileageKm: "car-mileage",
};

function focusFirstError(errors: DraftErrors) {
  const field = FIELDS.find((candidate) => errors[candidate]);

  if (field) {
    document.getElementById(FIELD_IDS[field])?.focus();
  }
}

export function CarFormDialog({
  mode,
  initial,
  onSubmit,
  onClose,
  onUnauthenticated,
}: CarFormDialogProps) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<DraftErrors>({});
  const action = useApiAction(onUnauthenticated);
  const creating = mode === "create";
  const optional = ` (${carsCopy.fields.optional})`;

  function update(patch: Partial<CarDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (action.pending) {
      return;
    }

    const found = validateDraft(draft, FIELDS);

    setErrors(found);
    focusFirstError(found);

    if (!hasErrors(found)) {
      await action.run(() => onSubmit(draft));
    }
  }

  return (
    <Modal
      title={creating ? carsCopy.create.title : carsCopy.edit.title}
      onClose={onClose}
      busy={action.pending}
    >
      <form noValidate onSubmit={submit} aria-busy={action.pending}>
        <div className="modal-body">
          <div className="modal-content">
            <div className="form-grid">
              <Field
                id={FIELD_IDS.plate}
                name="plate"
                icon={false}
                label={`${carsCopy.fields.plate} *`}
                placeholder={carsCopy.fields.platePlaceholder}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={30}
                required
                disabled={action.pending}
                value={draft.plate}
                error={errors.plate && carDraftErrorText[errors.plate]}
                onChange={(event) => update({ plate: event.target.value })}
              />
              <Field
                id={FIELD_IDS.make}
                name="make"
                icon={false}
                label={`${carsCopy.fields.make}${optional}`}
                placeholder={carsCopy.fields.makePlaceholder}
                autoComplete="off"
                maxLength={60}
                disabled={action.pending}
                value={draft.make}
                error={errors.make && carDraftErrorText[errors.make]}
                onChange={(event) => update({ make: event.target.value })}
              />
              <Field
                id={FIELD_IDS.model}
                name="model"
                icon={false}
                label={`${carsCopy.fields.model}${optional}`}
                placeholder={carsCopy.fields.modelPlaceholder}
                autoComplete="off"
                maxLength={60}
                disabled={action.pending}
                value={draft.model}
                error={errors.model && carDraftErrorText[errors.model]}
                onChange={(event) => update({ model: event.target.value })}
              />
              <Field
                id={FIELD_IDS.vin}
                name="vin"
                icon={false}
                label={`${carsCopy.fields.vin}${optional}`}
                placeholder={carsCopy.fields.vinPlaceholder}
                hint={carsCopy.fields.vinHint}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={20}
                disabled={action.pending}
                value={draft.vin}
                error={errors.vin && carDraftErrorText[errors.vin]}
                onChange={(event) => update({ vin: event.target.value })}
              />
              <Field
                id={FIELD_IDS.mileageKm}
                name="mileageKm"
                icon={false}
                inputMode="numeric"
                label={`${carsCopy.fields.mileageKm}${optional}`}
                autoComplete="off"
                maxLength={9}
                disabled={action.pending}
                value={draft.mileageKm}
                error={
                  errors.mileageKm && carDraftErrorText[errors.mileageKm]
                }
                onChange={(event) => update({ mileageKm: event.target.value })}
              />
              <Field
                id="car-serviced-at"
                name="servicedAt"
                type="date"
                icon={false}
                label={`${carsCopy.fields.servicedAt}${optional}`}
                disabled={action.pending}
                value={draft.servicedAt}
                onChange={(event) => update({ servicedAt: event.target.value })}
              />
            </div>

            {action.failure && (
              <p className="banner error" role="alert">
                {carFailureText[action.failure.kind]}
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
            {carsCopy.cancel}
          </button>
          <PendingButton
            type="submit"
            className="btn primary"
            pending={action.pending}
            pendingLabel={carsCopy.pending}
          >
            {creating ? carsCopy.create.submit : carsCopy.edit.submit}
          </PendingButton>
        </footer>
      </form>
    </Modal>
  );
}

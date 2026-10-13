import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ConfirmRemoveDialog } from "../../../common/ui/components/ConfirmRemoveDialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../../common/ui/components/ListStates";
import { Pagination } from "../../../common/ui/components/Pagination";
import { useDebouncedCallback } from "../../../common/ui/hooks/useDebouncedCallback";
import { usePagedList } from "../../../common/ui/hooks/usePagedList";
import {
  fromSearchParams,
  toDraft,
  toSearchParams,
} from "../../domain/mappers/CarMapper";
import type { Car } from "../../domain/models/Car";
import { EMPTY_CAR_DRAFT, type CarDraft } from "../../domain/models/CarDraft";
import type { CarFilters } from "../../domain/models/CarFilters";
import type { CarApi } from "../../domain/services/CarService";
import {
  carEmptyStateCopy,
  carFailureText,
  carPaginationCopy,
  carRemoveCopy,
  carsCopy,
} from "../assets/copy";
import { CarDriversDialog } from "../components/CarDriversDialog";
import { CarFormDialog } from "../components/CarFormDialog";
import { CarsTable, type CarRowAction } from "../components/CarsTable";
import { CarsToolbar } from "../components/CarsToolbar";

const SEARCH_DEBOUNCE_MS = 300;

type Dialog =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; car: Car }
  | { kind: "drivers"; car: Car }
  | { kind: "remove"; car: Car };

interface CarsPageProps {
  cars: CarApi;
  /** The API rejected the session; the host decides how to sign the user out. */
  onSessionExpired: () => void;
}

export function CarsPage({ cars, onSessionExpired }: CarsPageProps) {
  const [params, setParams] = useSearchParams();
  const { filters, page } = useMemo(() => fromSearchParams(params), [params]);
  const [searchText, setSearchText] = useState(filters.text);
  const [urlText, setUrlText] = useState(filters.text);
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const [success, setSuccess] = useState<string>();
  const filtered = Boolean(filters.text);

  function navigate(nextFilters: CarFilters, nextPage: number) {
    setParams(toSearchParams({ filters: nextFilters, page: nextPage }), {
      replace: true,
    });
  }

  const list = usePagedList(cars, filters, page, onSessionExpired, (previous) =>
    navigate(filters, previous),
  );
  const { reload } = list;

  // Back/forward navigation or a pasted link changes the address bar without going through the input.
  if (filters.text !== urlText) {
    setUrlText(filters.text);
    setSearchText(filters.text);
  }

  const search = useDebouncedCallback(
    (text: string) => navigate({ text }, 0),
    SEARCH_DEBOUNCE_MS,
  );

  function changeSearch(text: string) {
    setSearchText(text);
    search.call(text);
  }

  function clearFilters() {
    search.cancel();
    setSearchText("");
    navigate({ text: "" }, 0);
  }

  function closeDialog() {
    setDialog({ kind: "none" });
  }

  async function create(draft: CarDraft) {
    await cars.create(draft);

    const listChanges = filters.text !== "" || page !== 0;

    search.cancel();
    setSearchText("");
    navigate({ text: "" }, 0);
    setSuccess(carsCopy.notices.created);
    closeDialog();

    if (!listChanges) {
      reload();
    }
  }

  async function edit(car: Car, draft: CarDraft) {
    await cars.update(car.id, draft);

    setSuccess(carsCopy.notices.saved);
    closeDialog();
    reload();
  }

  async function remove(car: Car) {
    await cars.remove(car.id);

    setSuccess(carsCopy.notices.removed);
    closeDialog();
    reload();
  }

  function onRowAction(car: Car, action: CarRowAction) {
    setSuccess(undefined);

    switch (action) {
      case "edit": {
        setDialog({ kind: "edit", car });

        break;
      }

      case "drivers": {
        setDialog({ kind: "drivers", car });

        break;
      }

      case "remove": {
        setDialog({ kind: "remove", car });

        break;
      }
    }
  }

  function renderBody() {
    if (list.failure) {
      return (
        <ErrorState
          title={carsCopy.errorTitle}
          message={
            list.failure.kind === "unavailable"
              ? carsCopy.errorBody
              : carFailureText[list.failure.kind]
          }
          retryLabel={carsCopy.retry}
          onRetry={reload}
        />
      );
    }

    if (!list.page) {
      return <LoadingState message={carsCopy.loading} />;
    }

    if (list.page.items.length === 0) {
      return (
        <EmptyState
          filtered={filtered || page > 0}
          copy={carEmptyStateCopy}
          onCreate={() => setDialog({ kind: "create" })}
          onClear={clearFilters}
        />
      );
    }

    return (
      <>
        <CarsTable
          cars={list.page.items}
          busy={list.loading}
          onAction={onRowAction}
        />
        <Pagination
          page={page}
          shown={list.page.items.length}
          hasNext={list.page.hasNext}
          disabled={list.loading}
          copy={carPaginationCopy}
          onPage={(next) => navigate(filters, next)}
        />
      </>
    );
  }

  return (
    <div className="list-page">
      <header className="page-head">
        <div>
          <h1>{carsCopy.title}</h1>
          <p className="muted">{carsCopy.subtitle}</p>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => setDialog({ kind: "create" })}
        >
          <span aria-hidden="true">+</span>
          {carsCopy.newCar}
        </button>
      </header>

      {success && (
        <div className="banner" role="status">
          <span>{success}</span>
          <button
            type="button"
            className="link-button"
            onClick={() => setSuccess(undefined)}
          >
            {carsCopy.dismiss}
          </button>
        </div>
      )}

      <CarsToolbar text={searchText} onTextChange={changeSearch} />

      <section className="panel">{renderBody()}</section>

      {dialog.kind === "create" && (
        <CarFormDialog
          mode="create"
          initial={EMPTY_CAR_DRAFT}
          onSubmit={create}
          onClose={closeDialog}
          onUnauthenticated={onSessionExpired}
        />
      )}
      {dialog.kind === "edit" && (
        <CarFormDialog
          mode="edit"
          initial={toDraft(dialog.car)}
          onSubmit={(draft) => edit(dialog.car, draft)}
          onClose={closeDialog}
          onUnauthenticated={onSessionExpired}
        />
      )}
      {dialog.kind === "drivers" && (
        <CarDriversDialog
          car={dialog.car}
          cars={cars}
          onChanged={reload}
          onClose={closeDialog}
          onUnauthenticated={onSessionExpired}
        />
      )}
      {dialog.kind === "remove" && (
        <ConfirmRemoveDialog
          copy={carRemoveCopy}
          failureText={carFailureText}
          target={
            <p className="remove-target">
              <strong>{dialog.car.plate}</strong>
            </p>
          }
          onConfirm={() => remove(dialog.car)}
          onClose={closeDialog}
          onUnauthenticated={onSessionExpired}
        />
      )}
    </div>
  );
}

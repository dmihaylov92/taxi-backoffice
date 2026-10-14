import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toApiFailure } from "../../../common/domain/mappers/ApiFailureMapper";
import { ConfirmRemoveDialog } from "../../../common/ui/components/ConfirmRemoveDialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../../common/ui/components/ListStates";
import { Pagination } from "../../../common/ui/components/Pagination";
import { usePagedList } from "../../../common/ui/hooks/usePagedList";
import { driverName } from "../../domain/models/Car";
import {
  fromSearchParams,
  toDraft,
  toSearchParams,
} from "../../domain/mappers/RideMapper";
import { rideNumber, type Ride } from "../../domain/models/Ride";
import type { RideOperations } from "../../domain/models/RideCapabilities";
import { EMPTY_RIDE_DRAFT, type RideDraft } from "../../domain/models/RideDraft";
import type { RideDriver } from "../../domain/models/RideDriver";
import type { RideFilters } from "../../domain/models/RideFilters";
import type { RideAction } from "../../domain/services/RideActionService";
import type { RideApi } from "../../domain/services/RideService";
import {
  ridePaginationCopy,
  rideFailureText,
  rideRemoveCopy,
  ridesCopy,
} from "../assets/rideCopy";
import { AssignDriverDialog } from "../components/AssignDriverDialog";
import { RideActionDialog } from "../components/RideActionDialog";
import { RideDetailsDialog } from "../components/RideDetailsDialog";
import { RideFormDialog } from "../components/RideFormDialog";
import { RideNotice, type RideNoticeState } from "../components/RideNotice";
import { RideStatusBadge } from "../components/RideBadges";
import { RideSummary } from "../components/RideSummary";
import { RidesTable } from "../components/RidesTable";
import { RidesToolbar } from "../components/RidesToolbar";
import { useRideDrivers } from "../components/useRideDrivers";

type Dialog =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; ride: Ride }
  | { kind: "assign"; ride: Ride }
  | { kind: "reject"; ride: Ride }
  | { kind: "reopen"; ride: Ride }
  | { kind: "remove"; ride: Ride };

interface RidesPageProps {
  rides: RideApi;
  /** Account id of the signed-in dispatcher, to word the dispatcher of a ride. */
  currentUserId: string;
  /** The API rejected the session; the host decides how to sign the user out. */
  onSessionExpired: () => void;
}

export function RidesPage({
  rides,
  currentUserId,
  onSessionExpired,
}: RidesPageProps) {
  const [params, setParams] = useSearchParams();
  const { filters, page } = useMemo(() => fromSearchParams(params), [params]);
  /** Read-only details stay open underneath the operation chosen from them. */
  const [detail, setDetail] = useState<Ride>();
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const [notice, setNotice] = useState<RideNoticeState>();
  const directory = useRideDrivers(rides);
  const heading = useRef<HTMLHeadingElement>(null);
  /** Bumped when the element that opened a dialog is gone, so focus goes to the page heading. */
  const [headingFocus, setHeadingFocus] = useState(0);
  const filtered = Boolean(filters.status);
  const operations: RideOperations = useMemo(
    () => ({ assign: Boolean(rides.assign), reopen: Boolean(rides.reopen) }),
    [rides],
  );
  const suggest = useMemo(() => {
    const search = rides.suggestAddresses?.bind(rides);

    return search
      ? (text: string, signal: AbortSignal) => search(text, signal)
      : undefined;
  }, [rides]);

  useEffect(() => {
    if (headingFocus > 0) {
      heading.current?.focus();
    }
  }, [headingFocus]);

  function navigate(nextFilters: RideFilters, nextPage: number) {
    setParams(toSearchParams({ filters: nextFilters, page: nextPage }), {
      replace: true,
    });
  }

  const list = usePagedList(rides, filters, page, onSessionExpired, (previous) =>
    navigate(filters, previous),
  );
  const reloadList = list.reload;
  const reloadDrivers = directory.reload;

  function reloadAll() {
    reloadList();
    reloadDrivers();
  }

  function closeAll() {
    setDialog({ kind: "none" });
    setDetail(undefined);
  }

  /** A stale ride was reported; refresh everything and drop the dialogs built on old data. */
  function reloadAndClose() {
    closeAll();
    reloadAll();
  }

  /**
   * Runs one write with a pending notice that is cleared when it settles. Success feedback is
   * set by the caller, only after this resolves, so it never precedes server confirmation.
   */
  async function confirmed<Result>(task: () => Promise<Result>): Promise<Result> {
    setNotice({
      tone: "pending",
      title: ridesCopy.notices.pendingTitle,
      body: ridesCopy.notices.pendingBody,
    });

    try {
      return await task();
    } finally {
      setNotice((current) => (current?.tone === "pending" ? undefined : current));
    }
  }

  async function create(draft: RideDraft) {
    const created = await confirmed(() => rides.create(draft));
    const listChanges = filters.status !== undefined || page !== 0;

    // A new ride is the newest one; show it from the first page with no filter hiding it.
    navigate({}, 0);
    setNotice({
      tone: "success",
      title: ridesCopy.notices.created(rideNumber(created.id)),
      body: ridesCopy.notices.createdBody(ridesCopy.statuses[created.status]),
    });
    closeAll();

    if (!listChanges) {
      reloadAll();
    }
  }

  async function edit(ride: Ride, draft: RideDraft) {
    const saved = await confirmed(() => rides.update(ride.id, draft));

    setNotice({
      tone: "success",
      title: ridesCopy.notices.saved,
      body: ridesCopy.notices.savedBody(rideNumber(saved.id)),
    });
    closeAll();
    reloadAll();
  }

  async function reject(ride: Ride) {
    await confirmed(() => rides.reject(ride.id));

    setNotice({
      tone: "success",
      title: ridesCopy.notices.rejected,
      body: ridesCopy.notices.rejectedBody(rideNumber(ride.id)),
    });
    closeAll();
    reloadAll();
  }

  async function reopen(ride: Ride) {
    const reopenRide = rides.reopen?.bind(rides);

    if (!reopenRide) {
      return;
    }

    await confirmed(() => reopenRide(ride.id));

    setNotice({
      tone: "success",
      title: ridesCopy.notices.reopened,
      body: ridesCopy.notices.reopenedBody(rideNumber(ride.id)),
    });
    closeAll();
    reloadAll();
  }

  async function assign(ride: Ride, driver: RideDriver) {
    const assignRide = rides.assign?.bind(rides);

    if (!assignRide) {
      return;
    }

    await confirmed(() => assignRide(ride.id, driver.id));

    setNotice({
      tone: "success",
      title: ridesCopy.notices.assigned,
      body: ridesCopy.notices.assignedBody(
        driverName(driver),
        rideNumber(ride.id),
      ),
    });
    closeAll();
    reloadAll();
  }

  async function remove(ride: Ride) {
    try {
      await confirmed(() => rides.remove(ride.id));
    } catch (error) {
      // Already deleted elsewhere: the dialog explains it and the list catches up behind it.
      if (toApiFailure(error).kind === "notFound") {
        reloadAll();
      }

      throw error;
    }

    setNotice({
      tone: "success",
      title: ridesCopy.notices.removed,
      body: ridesCopy.notices.removedBody(rideNumber(ride.id)),
    });
    closeAll();
    reloadAll();
    setHeadingFocus((count) => count + 1);
  }

  function openOperation(ride: Ride, action: RideAction) {
    setNotice(undefined);

    switch (action) {
      case "view": {
        setDetail(ride);

        break;
      }

      case "edit": {
        setDialog({ kind: "edit", ride });

        break;
      }

      case "assign": {
        if (operations.assign) {
          setDialog({ kind: "assign", ride });
        }

        break;
      }

      case "reject": {
        setDialog({ kind: "reject", ride });

        break;
      }

      case "reopen": {
        if (operations.reopen) {
          setDialog({ kind: "reopen", ride });
        }

        break;
      }

      case "remove": {
        setDialog({ kind: "remove", ride });

        break;
      }
    }
  }

  function renderBody() {
    if (list.failure) {
      return (
        <ErrorState
          title={ridesCopy.errorTitle}
          message={
            list.failure.kind === "unavailable" ||
            list.failure.kind === "invalid"
              ? ridesCopy.errorBody
              : rideFailureText[list.failure.kind]
          }
          retryLabel={ridesCopy.retry}
          onRetry={reloadAll}
        />
      );
    }

    if (!list.page) {
      return <LoadingState message={ridesCopy.loading} />;
    }

    if (list.page.items.length === 0) {
      return (
        <EmptyState
          filtered={filtered || page > 0}
          copy={{
            title: ridesCopy.emptyTitle,
            body: ridesCopy.emptyBody,
            create: ridesCopy.newRide,
            noResultsTitle: ridesCopy.noResultsTitle,
            noResultsBody: ridesCopy.noResultsBody(
              filters.status ? ridesCopy.statuses[filters.status] : undefined,
            ),
            clearFilters: ridesCopy.clearFilters,
          }}
          onCreate={() => setDialog({ kind: "create" })}
          onClear={() => navigate({}, 0)}
        />
      );
    }

    return (
      <>
        <RidesTable
          rides={list.page.items}
          drivers={directory.drivers}
          capabilities={rides.capabilities}
          operations={operations}
          busy={list.loading}
          onAction={openOperation}
        />
        <Pagination
          page={page}
          shown={list.page.items.length}
          hasNext={list.page.hasNext}
          disabled={list.loading}
          copy={ridePaginationCopy}
          onPage={(next) => navigate(filters, next)}
        />
      </>
    );
  }

  const assignedName = (ride: Ride) => {
    const driver = ride.driverId ? directory.drivers.get(ride.driverId) : undefined;

    return driver ? driverName(driver) : undefined;
  };

  return (
    <div className="list-page rides-page">
      <header className="page-head">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {ridesCopy.title}
          </h1>
          <p className="muted">{ridesCopy.subtitle}</p>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            setNotice(undefined);
            setDialog({ kind: "create" });
          }}
        >
          <span aria-hidden="true">+</span>
          {ridesCopy.newRide}
        </button>
      </header>

      <RideNotice notice={notice} onDismiss={() => setNotice(undefined)} />

      <RidesToolbar
        status={filters.status}
        onStatusChange={(status) => navigate({ status }, 0)}
      />

      <section className="panel">{renderBody()}</section>

      {detail && (
        <RideDetailsDialog
          ride={detail}
          drivers={directory.drivers}
          capabilities={rides.capabilities}
          operations={operations}
          currentUserId={currentUserId}
          onAction={(action) => openOperation(detail, action)}
          onClose={() => setDetail(undefined)}
        />
      )}

      {dialog.kind === "create" && (
        <RideFormDialog
          mode="create"
          initial={EMPTY_RIDE_DRAFT}
          drivers={directory.drivers}
          capabilities={rides.capabilities}
          assignAvailable={operations.assign}
          suggest={suggest}
          onSubmit={create}
          onReload={reloadAndClose}
          onClose={() => setDialog({ kind: "none" })}
          onUnauthenticated={onSessionExpired}
        />
      )}
      {dialog.kind === "edit" && (
        <RideFormDialog
          mode="edit"
          initial={toDraft(dialog.ride)}
          ride={dialog.ride}
          drivers={directory.drivers}
          capabilities={rides.capabilities}
          assignAvailable={operations.assign}
          suggest={suggest}
          onSubmit={(draft) => edit(dialog.ride, draft)}
          onReload={reloadAndClose}
          onClose={() => setDialog({ kind: "none" })}
          onUnauthenticated={onSessionExpired}
        />
      )}
      {dialog.kind === "assign" && (
        <AssignDriverDialog
          ride={dialog.ride}
          rides={rides}
          onAssign={(driver) => assign(dialog.ride, driver)}
          onReload={reloadAndClose}
          onClose={() => setDialog({ kind: "none" })}
          onUnauthenticated={onSessionExpired}
        />
      )}
      {dialog.kind === "reject" && (
        <RideActionDialog
          title={ridesCopy.reject.title}
          tone="danger"
          confirmLabel={ridesCopy.reject.confirm}
          pendingLabel={ridesCopy.reject.pending}
          onConfirm={() => reject(dialog.ride)}
          onReload={reloadAndClose}
          onClose={() => setDialog({ kind: "none" })}
          onUnauthenticated={onSessionExpired}
        >
          <p>{ridesCopy.reject.question}</p>
          <div className="summary-card">
            <RideSummary ride={dialog.ride} />
          </div>
          <ul className="consequences">
            {dialog.ride.driverId && (
              <li>
                {rides.capabilities.driverNotifications
                  ? ridesCopy.reject.notifiesDriver(assignedName(dialog.ride))
                  : ridesCopy.reject.notNotified}
              </li>
            )}
            <li>{ridesCopy.reject.keepsAvailability}</li>
            <li>{ridesCopy.reject.reopenable}</li>
          </ul>
        </RideActionDialog>
      )}
      {dialog.kind === "reopen" && (
        <RideActionDialog
          title={ridesCopy.reopen.title}
          tone="primary"
          confirmLabel={ridesCopy.reopen.confirm}
          pendingLabel={ridesCopy.reopen.pending}
          onConfirm={() => reopen(dialog.ride)}
          onReload={reloadAndClose}
          onClose={() => setDialog({ kind: "none" })}
          onUnauthenticated={onSessionExpired}
        >
          <p>{ridesCopy.reopen.question}</p>
          <div className="summary-card">
            <RideSummary ride={dialog.ride} />
          </div>
          <p className="current-status">
            {ridesCopy.reopen.currentStatus}{" "}
            <RideStatusBadge status={dialog.ride.status} />
          </p>
          <p className="muted">
            {ridesCopy.reopen.note(ridesCopy.statuses[dialog.ride.status])}
          </p>
        </RideActionDialog>
      )}
      {dialog.kind === "remove" && (
        <ConfirmRemoveDialog
          copy={rideRemoveCopy}
          failureText={rideFailureText}
          target={
            <div className="remove-target">
              <RideSummary ride={dialog.ride} />
              <RideStatusBadge status={dialog.ride.status} />
            </div>
          }
          onConfirm={() => remove(dialog.ride)}
          onClose={() => setDialog({ kind: "none" })}
          onUnauthenticated={onSessionExpired}
        />
      )}
    </div>
  );
}

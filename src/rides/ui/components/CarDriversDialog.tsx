import { useEffect, useState } from "react";
import { toApiFailure } from "../../../common/domain/mappers/ApiFailureMapper";
import { Modal } from "../../../common/ui/components/Modal";
import { useApiAction } from "../../../common/ui/hooks/useApiAction";
import { useLatest } from "../../../common/ui/hooks/useLatest";
import { driverName, type Car, type CarDriver } from "../../domain/models/Car";
import type { CarApi } from "../../domain/services/CarService";
import { carFailureText, carsCopy } from "../assets/copy";

type DriverApi = Pick<
  CarApi,
  "assignDriver" | "unassignDriver" | "searchDrivers"
>;

interface CarDriversDialogProps {
  car: Car;
  cars: DriverApi;
  /** Called with the car returned by the API after each confirmed change. */
  onChanged: (car: Car) => void;
  onClose: () => void;
  onUnauthenticated: () => void;
}

interface Candidates {
  loading: boolean;
  items: CarDriver[];
  failed: boolean;
}

const SEARCH_DEBOUNCE_MS = 300;

/** Lists the car's drivers and lets an administrator remove them or assign active drivers. */
export function CarDriversDialog({
  car,
  cars,
  onChanged,
  onClose,
  onUnauthenticated,
}: CarDriversDialogProps) {
  const [current, setCurrent] = useState(car);
  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState<Candidates>({
    loading: true,
    items: [],
    failed: false,
  });
  const [notice, setNotice] = useState<string>();
  const action = useApiAction(onUnauthenticated);
  const unauthenticated = useLatest(onUnauthenticated);
  const assignedIds = new Set(current.drivers.map((driver) => driver.id));
  const available = candidates.items.filter(
    (driver) => !assignedIds.has(driver.id),
  );

  useEffect(() => {
    const controller = new AbortController();

    // Previous candidates stay visible while the next search is in flight.
    setCandidates((state) => ({ ...state, loading: true, failed: false }));

    const timer = window.setTimeout(
      () => {
        cars
          .searchDrivers(text, controller.signal)
          .then((items) => {
            if (!controller.signal.aborted) {
              setCandidates({ loading: false, items, failed: false });
            }
          })
          .catch((error: unknown) => {
            if (controller.signal.aborted) {
              return;
            }

            setCandidates({ loading: false, items: [], failed: true });

            if (toApiFailure(error).kind === "unauthenticated") {
              unauthenticated.current();
            }
          });
      },
      text ? SEARCH_DEBOUNCE_MS : 0,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cars, text, unauthenticated]);

  function change(
    request: () => Promise<Car>,
    message: string,
  ) {
    setNotice(undefined);
    void action.run(async () => {
      const updated = await request();

      setCurrent(updated);
      setNotice(message);
      onChanged(updated);
    });
  }

  return (
    <Modal
      title={carsCopy.drivers.title(current.plate)}
      onClose={onClose}
      busy={action.pending}
    >
      <div className="modal-body">
        <div className="modal-content driver-dialog">
          {notice && (
            <p className="banner" role="status">
              {notice}
            </p>
          )}
          {action.failure && (
            <p className="banner error" role="alert">
              {carFailureText[action.failure.kind]}
            </p>
          )}

          <section aria-labelledby="car-drivers-assigned">
            <h3 id="car-drivers-assigned">{carsCopy.drivers.assigned}</h3>
            {current.drivers.length === 0 ? (
              <p className="muted">{carsCopy.drivers.noneAssigned}</p>
            ) : (
              <ul className="driver-rows">
                {current.drivers.map((driver) => (
                  <li key={driver.id} className="driver-row">
                    <span>
                      <strong>{driverName(driver)}</strong>
                      <span className="muted">{driver.email}</span>
                    </span>
                    <button
                      type="button"
                      className="btn"
                      aria-label={carsCopy.drivers.unassignFor(
                        driverName(driver),
                      )}
                      disabled={action.pending}
                      onClick={() =>
                        change(
                          () => cars.unassignDriver(current.id, driver.id),
                          carsCopy.drivers.unassignedNotice,
                        )
                      }
                    >
                      {carsCopy.drivers.unassign}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="car-drivers-add">
            <h3 id="car-drivers-add">{carsCopy.drivers.add}</h3>
            <div className="search">
              <input
                type="search"
                aria-label={carsCopy.drivers.searchLabel}
                placeholder={carsCopy.drivers.searchPlaceholder}
                maxLength={100}
                autoComplete="off"
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </div>
            <p className="hint">{carsCopy.drivers.releaseHint}</p>
            {candidates.loading && (
              <p className="state-line" role="status">
                <span className="spinner" aria-hidden="true" />
                {carsCopy.drivers.loading}
              </p>
            )}
            {!candidates.loading && candidates.failed && (
              <p className="banner error" role="alert">
                {carsCopy.drivers.searchFailed}
              </p>
            )}
            {!candidates.loading &&
              !candidates.failed &&
              available.length === 0 && (
                <p className="muted">{carsCopy.drivers.noCandidates}</p>
              )}
            {available.length > 0 && (
              <ul className="driver-rows" aria-busy={candidates.loading}>
                {available.map((driver) => (
                  <li key={driver.id} className="driver-row">
                    <span>
                      <strong>{driverName(driver)}</strong>
                      <span className="muted">{driver.email}</span>
                    </span>
                    <button
                      type="button"
                      className="btn primary"
                      aria-label={carsCopy.drivers.assignFor(
                        driverName(driver),
                      )}
                      disabled={action.pending}
                      onClick={() =>
                        change(
                          () => cars.assignDriver(current.id, driver.id),
                          carsCopy.drivers.assignedNotice,
                        )
                      }
                    >
                      {carsCopy.drivers.assign}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <footer className="modal-foot">
        <button
          type="button"
          className="btn"
          disabled={action.pending}
          onClick={onClose}
        >
          {carsCopy.drivers.close}
        </button>
      </footer>
    </Modal>
  );
}

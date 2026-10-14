import { useEffect, useRef, useState } from "react";
import { toApiFailure } from "../../../common/domain/mappers/ApiFailureMapper";
import type { RideDriver } from "../../domain/models/RideDriver";
import type { RideApi } from "../../domain/services/RideService";

const NO_DRIVERS: ReadonlyMap<string, RideDriver> = new Map();

/**
 * Driver names and availability for the rides on screen, from one lookup per load. The lookup is
 * best effort: a dispatcher without access to accounts, or a transient failure, leaves the map
 * empty and the screens fall back to a generic "assigned driver" label rather than failing. Once
 * the API has said the account may not look drivers up, it is not asked again.
 */
export function useRideDrivers(rides: Pick<RideApi, "drivers">) {
  const [drivers, setDrivers] = useState(NO_DRIVERS);
  const [reloadKey, setReloadKey] = useState(0);
  const forbidden = useRef(false);

  useEffect(() => {
    if (forbidden.current) {
      return;
    }

    const controller = new AbortController();

    rides
      .drivers(controller.signal)
      .then((loaded) => {
        if (!controller.signal.aborted) {
          setDrivers(new Map(loaded.map((driver) => [driver.id, driver])));
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        forbidden.current = toApiFailure(error).kind === "forbidden";
        setDrivers(NO_DRIVERS);
      });

    return () => controller.abort();
  }, [rides, reloadKey]);

  return { drivers, reload: () => setReloadKey((key) => key + 1) };
}

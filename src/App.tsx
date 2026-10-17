import { useState } from "react";
import { AccountClient } from "./accounts/domain/clients/AccountClient";
import {
  AccountService,
  type AccountApi,
} from "./accounts/domain/services/AccountService";
import { AppRoutes } from "./AppRoutes";
import { authService, type AuthApi } from "./auth/domain/services/AuthService";
import { AuthSessionProvider } from "./auth/ui/components/AuthSessionProvider";
import { ApiClient } from "./common/domain/clients/ApiClient";
import {
  createAddressSearch,
  type AddressSearchApi,
} from "./common/domain/services/AddressSearchService";
import { AddressSearchProvider } from "./common/ui/components/AddressSearchProvider";
import { CarClient } from "./rides/domain/clients/CarClient";
import { DriverLookupClient } from "./rides/domain/clients/DriverLookupClient";
import { RideClient } from "./rides/domain/clients/RideClient";
import { CarService, type CarApi } from "./rides/domain/services/CarService";
import { RideService, type RideApi } from "./rides/domain/services/RideService";

/** Account requests renew the cookie session once through the same auth port before giving up on a 401. */
function createAccountService(auth: AuthApi): AccountApi {
  return new AccountService(
    new AccountClient(
      new ApiClient({ recover: async () => (await auth.renew?.()) ?? false }),
    ),
  );
}

/** Car requests renew the cookie session the same way account requests do. */
function createCarService(auth: AuthApi): CarApi {
  const api = new ApiClient({
    recover: async () => (await auth.renew?.()) ?? false,
  });

  return new CarService(new CarClient(api), new DriverLookupClient(api));
}

/** Ride requests renew the cookie session the same way account and car requests do. */
function createRideService(auth: AuthApi): RideApi {
  const api = new ApiClient({
    recover: async () => (await auth.renew?.()) ?? false,
  });

  return new RideService(new RideClient(api), new DriverLookupClient(api));
}

export function App({
  auth = authService,
  accounts,
  cars,
  rides,
  addressSearch,
  linkToken,
}: {
  auth?: AuthApi;
  accounts?: AccountApi;
  cars?: CarApi;
  rides?: RideApi;
  /** Address search for the address fields; defaults to the provider configured in the build. */
  addressSearch?: AddressSearchApi;
  linkToken?: string;
}) {
  const [defaultAccounts] = useState(() => createAccountService(auth));
  const [defaultCars] = useState(() => createCarService(auth));
  const [defaultRides] = useState(() => createRideService(auth));
  const [defaultAddressSearch] = useState(() => createAddressSearch());

  return (
    <AuthSessionProvider auth={auth}>
      <AddressSearchProvider search={addressSearch ?? defaultAddressSearch}>
        <AppRoutes
          services={{
            accounts: accounts ?? defaultAccounts,
            cars: cars ?? defaultCars,
            rides: rides ?? defaultRides,
          }}
          linkToken={linkToken}
        />
      </AddressSearchProvider>
    </AuthSessionProvider>
  );
}

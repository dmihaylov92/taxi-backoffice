import { ApiClient } from "../../../common/domain/clients/ApiClient";
import type { CarRequestBody } from "../mappers/CarMapper";

const API_ROOT = "/api/v1/cars";

/** Transport for the administrator car endpoints; responses are returned unvalidated. */
export class CarClient {
  constructor(private readonly api: ApiClient = new ApiClient()) {}

  async list(query: string, signal?: AbortSignal): Promise<unknown> {
    const response = await this.api.get(`${API_ROOT}?${query}`, signal);

    return response.json();
  }

  async create(body: CarRequestBody): Promise<unknown> {
    const response = await this.api.send("POST", API_ROOT, body);

    return response.json();
  }

  async update(id: string, body: CarRequestBody): Promise<unknown> {
    const response = await this.api.send("PUT", this.path(id), body);

    return response.json();
  }

  async remove(id: string): Promise<void> {
    await this.api.send("DELETE", this.path(id));
  }

  async assignDriver(carId: string, accountId: string): Promise<unknown> {
    const response = await this.api.send("PUT", this.driverPath(carId, accountId));

    return response.json();
  }

  async unassignDriver(carId: string, accountId: string): Promise<unknown> {
    const response = await this.api.send(
      "DELETE",
      this.driverPath(carId, accountId),
    );

    return response.json();
  }

  private path(id: string): string {
    return `${API_ROOT}/${encodeURIComponent(id)}`;
  }

  private driverPath(carId: string, accountId: string): string {
    return `${this.path(carId)}/drivers/${encodeURIComponent(accountId)}`;
  }
}

import { ApiClient } from "../../../common/domain/clients/ApiClient";
import type { RideRequestBody } from "../mappers/RideMapper";

const API_ROOT = "/api/v1/rides";

/** Transport for the dispatcher ride endpoints; responses are returned unvalidated. */
export class RideClient {
  constructor(private readonly api: ApiClient = new ApiClient()) {}

  async list(query: string, signal?: AbortSignal): Promise<unknown> {
    const response = await this.api.get(`${API_ROOT}?${query}`, signal);

    return response.json();
  }

  async create(body: RideRequestBody): Promise<unknown> {
    const response = await this.api.send("POST", API_ROOT, body);

    return response.json();
  }

  async update(id: string, body: RideRequestBody): Promise<unknown> {
    const response = await this.api.send("PUT", this.path(id), body);

    return response.json();
  }

  async reject(id: string): Promise<unknown> {
    const response = await this.api.send("POST", `${this.path(id)}/reject`);

    return response.json();
  }

  async assign(id: string, driverId: string): Promise<unknown> {
    const response = await this.api.send("POST", `${this.path(id)}/assign`, {
      driverId,
    });

    return response.json();
  }

  async reopen(id: string): Promise<unknown> {
    const response = await this.api.send("POST", `${this.path(id)}/reopen`);

    return response.json();
  }

  async remove(id: string): Promise<void> {
    await this.api.send("DELETE", this.path(id));
  }

  private path(id: string): string {
    return `${API_ROOT}/${encodeURIComponent(id)}`;
  }
}

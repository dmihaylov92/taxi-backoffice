import { ApiClient } from "../../../common/domain/clients/ApiClient";
import type { AccountRequestBody } from "../mappers/AccountMapper";

const API_ROOT = "/api/v1/accounts";

/** Transport for the administrator account endpoints; responses are returned unvalidated. */
export class AccountClient {
  constructor(private readonly api: ApiClient = new ApiClient()) {}

  async list(query: string, signal?: AbortSignal): Promise<unknown> {
    const response = await this.api.get(`${API_ROOT}?${query}`, signal);

    return response.json();
  }

  async create(body: AccountRequestBody): Promise<unknown> {
    const response = await this.api.send("POST", API_ROOT, body);

    return response.json();
  }

  async update(id: string, body: AccountRequestBody): Promise<unknown> {
    const response = await this.api.send("PUT", this.path(id), body);

    return response.json();
  }

  async remove(id: string): Promise<void> {
    await this.api.send("DELETE", this.path(id));
  }

  async resendInvitation(id: string): Promise<unknown> {
    const response = await this.api.send("POST", `${this.path(id)}/invitation`);

    return response.json();
  }

  private path(id: string): string {
    return `${API_ROOT}/${encodeURIComponent(id)}`;
  }
}

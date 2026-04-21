/**
 * Bearer token authentication provider
 */

import type { BearerAuthConfig } from "../config/types.js";

export interface AuthHeaders {
    Authorization: string;
}

export class BearerAuthProvider {
    constructor(private config: BearerAuthConfig) { }

    getHeaders(): AuthHeaders {
        return {
            Authorization: `Bearer ${this.config.token}`,
        };
    }
}

import { ITokens } from './Tokens';
import { Optional } from './Lang';

export interface IRefreshRequest {
  clientId: string;
  refreshToken: string;
}

export interface IGetTokensRequest {
  clientId: string;
  codeVerifier: string;
  redirectUri?: string;
}

export class Api {
  public constructor(private readonly issuer: string) {}

  public async refresh(req: IRefreshRequest): Promise<Optional<ITokens>> {
    return undefined;
  }

  public async getTokens(req: IGetTokensRequest): Promise<Optional<ITokens>> {
    return undefined;
  }
}

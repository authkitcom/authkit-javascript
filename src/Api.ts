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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async refresh(req: IRefreshRequest): Promise<Optional<ITokens>> {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getTokens(req: IGetTokensRequest): Promise<Optional<ITokens>> {
    return undefined;
  }
}

import { ITokens } from './Tokens';
import { Optional } from './Lang';

export interface IRefreshRequest {
  clientId: string;
  refreshToken: string;
}

export interface IGetTokensRequest {
  clientId: string;
  codeVerifier: string;
  code: string;
  redirectUri: string;
}

export class Api {
  public constructor(private readonly issuer: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async refresh(req: IRefreshRequest): Promise<Optional<ITokens>> {
    return undefined;
  }

  public async getTokens(req: IGetTokensRequest): Promise<Optional<ITokens>> {
    let tokens;
    try {
      const response = await fetch(`${this.issuer}/oauth/token`, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: req.clientId,
          grant_type: 'authorization_code',
          code: req.code,
          code_verifier: req.codeVerifier,
          redirect_uri: req.redirectUri,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      tokens = await response.json();
    } catch (e) {
      throw new Error('unable to fetch tokens');
    }
    if (tokens) {
      return tokens;
    } else {
      throw new Error('unable to parse tokens');
    }
  }
}

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

  public async getTokens(req: IGetTokensRequest): Promise<Optional<ITokens>> {
    let tokens;
    try {
      const fd = new FormData();
      fd.append('client_id', req.clientId);
      fd.append('grant_type', 'authorization_code');
      fd.append('code', req.codeVerifier);
      if (req.redirectUri) {
        fd.append('redirect_uri', req.redirectUri);
      }
      const response = await fetch(`${this.issuer}/oauth/token`, {
        method: 'POST',
        body: fd,
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

import { AuthKit } from './AuthKit';
import { ITokens } from './Tokens';
import { IAuthorizeParams } from './Types';

export interface IUserinfo {
  sub: string;
  [x: string]: any;
}

export interface IGetTokensParams {
  notAuthenticatedBehavior?: 'error' | 'redirect';
  authorizeOverrides?: IAuthorizeParams;
}

export interface IAuthentication {
  logout(): Promise<void>;

  // Default - sessionStorage, else refresh token, else prompt=none (silent), else error
  // RedirectOnAunathenticated - same as above, but trigger reidrect if not authenticated
  getTokens(params?: IGetTokensParams): Promise<ITokens>;
  isAuthenticated(): boolean;
  getUserinfo(): Promise<IUserinfo>;
}

export interface IAuthenticationState {
  userinfo?: IUserinfo;
  tokens?: ITokens;
}

export class Authentication implements IAuthentication {
  private state: IAuthenticationState;

  public constructor(private readonly authkit: AuthKit) {
    this.state = {};
  }

  public setState(state: IAuthenticationState) {
    this.state = state;
  }

  public getState(): IAuthenticationState {
    return this.state;
  }

  public async getTokens(params?: IGetTokensParams): Promise<ITokens> {
    return {
      expiresIn: 0,
    };
  }

  public async getUserinfo(): Promise<IUserinfo> {
    return {
      sub: '',
    };
  }

  public isAuthenticated(): boolean {
    return false;
  }

  public async logout(): Promise<void> {
    // tslint:disable-next-line:no-console
    console.log('hello');
    return;
  }
}

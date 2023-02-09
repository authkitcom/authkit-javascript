import { Authentication, IAuthentication, IAuthenticationState } from './Authentication';

import { Optional } from './Lang';
import { IPkceSource } from './Pkce';
import { IAuthorizeParams, IStorage } from './Types';
import { IAuthorizeUrlParams, makeAuthorizeUrl } from './Urls';

export interface ICreateParams {
  issuer: string;
  clientId: string;
  redirectHandler?: (uri: string) => void;
}

export interface IAuthKit {
  // Default - read from session storage, else redirect
  // Optional - true - reads from sessions storage, else do a prompt=none (silent), else unathenticated return
  authorize(params?: IAuthorizeParams): Promise<Optional<IAuthentication>>;
}

const storageConversationKey = '__authkit.storage.conversation';
const storageAuthenticationKey = '__authkit.storage.authentication';

interface IConversationState {
  nonce: string;
  codeVerifier: string;
}

export type IQueryParamSupplier = (name: string) => Optional<string>;

export class AuthKit implements IAuthKit {
  private readonly issuer: string;
  private readonly clientId: string;
  private readonly redirectHandler?: (url: string) => void;
  public constructor(
    params: ICreateParams,
    private readonly storage: IStorage,
    private readonly pkceSource: IPkceSource,
    private readonly queryParamSupplier: IQueryParamSupplier,
  ) {
    this.issuer = params.issuer;
    this.clientId = params.clientId;
    this.redirectHandler = params.redirectHandler;
  }

  public randomString(length: number): string {
    return makeId(length);
  }

  public async authorize(params?: IAuthorizeParams): Promise<Optional<IAuthentication>> {
    let authState = this.readStateFromStorage<IAuthenticationState>();
    if (authState) {
      // TODO - wire up redirect handlers
      return this.makeAuthentication(authState);
    }

    authState = await this.authorizeFromCode(params?.stateReturnHandler);

    if (authState) {
      return this.makeAuthentication(authState);
    }

    // See if we have a code
    let aParams: any = {
      clientId: this.clientId,
      issuer: this.issuer,
    };
    // Handle code return
    let redirectHandler = this.redirectHandler;
    if (params) {
      if (params.redirectHandler) {
        redirectHandler = params.redirectHandler;
      }
      aParams = {
        ...aParams,
        redirectUri: params.redirectUri,
        scope: params.scope ? params.scope.join(' ') : undefined,
        state: params.state,
      };
    }
    switch (params?.mode || 'Redirect') {
      case 'Silent':
        return this.authorizeWithIFrame({
          ...aParams,
          prompt: 'none',
          responseMode: 'web_message',
        });
      case 'Redirect':
        await this.authorizeRedirect(aParams, redirectHandler);
        return undefined;
    }
  }

  public async authorizeFromCode(
    stateReturnHandler?: (state: string) => void,
  ): Promise<Optional<IAuthenticationState>> {
    const code = this.queryParamSupplier('code');
    const state = this.queryParamSupplier('state');
    if (!code) {
      return undefined;
    }
    const auth = await this.authorizeFromCodeParams(code);
    if (auth && state && stateReturnHandler) {
      stateReturnHandler(state);
    }
    return auth;
  }

  public async authorizeWithIFrame(params: IAuthorizeUrlParams): Promise<Optional<IAuthentication>> {
    throw new Error('support this');
  }

  public async authorizeRedirect(params: IAuthorizeUrlParams, redirectHandler?: (uri: string) => void) {
    if (!redirectHandler) {
      throw new Error('redirect handler not provided');
    }

    const nonce = this.randomString(32);
    const pkce = this.pkceSource.create();

    const state = {
      codeVerifier: pkce.verifier,
      nonce,
    };

    this.writeConversationStateToStorage(state);

    redirectHandler(
      makeAuthorizeUrl({
        ...params,
        codeChallenge: pkce.challenge,
      }),
    );
  }
  private async authorizeFromCodeParams(code: string): Promise<Optional<IAuthenticationState>> {
    const convState = this.readStateFromStorage<IConversationState>();
    return undefined;
  }

  private readStateFromStorage<T>(): Optional<T> {
    // TODO - how to determine if it is expired?
    const state = this.storage.getItem(storageAuthenticationKey);
    if (!state) {
      return undefined;
    } else {
      return JSON.parse(state);
    }
  }

  private writeAuthenticationStateToStorage(state: IAuthenticationState) {
    this.storage.setItem(storageAuthenticationKey, JSON.stringify(state));
  }

  private writeConversationStateToStorage(state: IConversationState) {
    this.storage.setItem(storageConversationKey, JSON.stringify(state));
  }

  private makeAuthentication(authState: IAuthenticationState): IAuthentication {
    const result = new Authentication(this);
    result.setState(authState);
    return result;
  }
}

// https://stackoverflow.com/a/1349426
function makeId(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

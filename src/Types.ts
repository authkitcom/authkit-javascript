export type AuthorizeMode = 'silent' | 'redirect';

export type IRedirectHandler = (uri: string) => void;
export type IStateReturnHandler = (uri: string) => void;

export interface IAuthorizeParams {
  mode?: AuthorizeMode;
  state?: string;
  redirectHandler?: IRedirectHandler;
  stateReturnHandler?: IStateReturnHandler;
  redirectUri: string;
  scope: string[];
}

export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

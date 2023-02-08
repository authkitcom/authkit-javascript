export type AuthorizeMode = 'Silent' | 'Redirect';

export interface IAuthorizeParams {
  mode?: AuthorizeMode;
  state?: string;
  redirectHandler?: (uri: string) => void;
  stateReturnHandler?: (state: string) => void;
  redirectUri?: string;
  scope: string[];
}

export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface IAuthorizeUrlParams {
  issuer: string;
  clientId: string;
  codeChallenge?: string;
  prompt?: string;
  responseMode?: string;
  scope?: string;
  state?: string;
  redirectUri?: string;
}

export function makeAuthorizeUrl(params: IAuthorizeUrlParams): string {
  return '';
}

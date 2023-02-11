export interface IAuthorizeUrlParams {
  issuer: string;
  clientId: string;
  codeChallenge?: string;
  prompt?: string;
  responseMode?: string;
  scope?: string;
  state?: string;
  nonce?: string;
  redirectUri?: string;
}

export function makeAuthorizeUrl(params: IAuthorizeUrlParams): string {
  const sb: string[] = [];
  sb.push(params.issuer);
  sb.push('/authorize?client_id=');
  sb.push(params.clientId);
  if (params.scope) {
    sb.push('&scope=');
    sb.push(encodeURIComponent(params.scope));
  }
  if (params.codeChallenge) {
    sb.push('&code_challenge=');
    sb.push(encodeURIComponent(params.codeChallenge));
    sb.push('&code_challenge_method=S256');
  }
  if (params.state) {
    sb.push('&state=');
    sb.push(encodeURIComponent(params.state));
  }
  if (params.nonce) {
    sb.push('&nonce=');
    sb.push(encodeURIComponent(params.nonce));
  }
  if (params.redirectUri) {
    sb.push('&redirect_uri=');
    sb.push(encodeURIComponent(params.redirectUri));
  }

  return sb.join('');
}

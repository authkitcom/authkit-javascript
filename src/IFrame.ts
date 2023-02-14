import { Optional } from './Lang';
import { ITokens } from './Tokens';
import { IAuthorizeUrlParams } from './Urls';

export class IFrame {
  //todo unit test
  private buildQueryFromParams(baseUrl: string, params: Record<string, Optional<string>>): string {
    let query = baseUrl;
    for (const key in params) {
      if (params[key]) {
        if (query !== baseUrl) {
          query += '&';
        }
        query += `${key}=${params[key]}`;
      }
    }

    return encodeURI(query);
  }

  public async getTokens(params: IAuthorizeUrlParams): Promise<Optional<ITokens>> {
    return new Promise<Optional<ITokens>>((resolve, reject) => {
      const authUrl = this.buildQueryFromParams(`${params.issuer}/authorize?`, {
        response_type: 'token',
        client_id: params.clientId,
        state: params.state,
        redirect_uri: params.redirectUri,
        response_mode: params.responseMode,
        prompt: params.prompt,
        scope: params.scope,
        nonce: params.nonce,
        code: params.codeChallenge,
      });
      const iframe = window.document.createElement('iframe');
      iframe.style.display = 'none';

      const iframeEventHandler = (e: MessageEvent) => {
        if (e.origin !== params.issuer) {
          return;
        }
        if (!e.data?.type || e.data.type !== 'authorization_response') {
          return;
        }
        const source = e.source;
        if (source) {
          (e.source as any).close();
        }
        if (e.data.error) {
          reject(e.data.response);
        } else {
          resolve(e.data.response as Optional<ITokens>);
        }
        window.removeEventListener('message', iframeEventHandler, false);
        if (window.document.body.contains(iframe)) {
          window.document.body.removeChild(iframe);
        }
      };
      window.addEventListener('message', () => {}, false);
      iframe.setAttribute('src', authUrl);
      window.document.body.append(iframe);
    });
  }
}

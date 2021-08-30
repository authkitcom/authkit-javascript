import axios from 'axios';
import * as queryString from 'query-string';
import { Optional } from './Lang';
import { IPkce, PkceSource } from './Pkce';
import { Tokens } from './Tokens';

interface ICreateParams {
  issuer: string;
  clientId: string;
  scope: string[];
}

interface IAuthorizeParams {
  state?: string;
  stateReturn?: (state: string) => void;
  binding?: string;
  extensions?: any;
}
interface IStorage {
  thisUri: string;
  nonce: string;
  pkce: IPkce;
  state?: string;
}

interface IUserinfo {
  sub: string;
  [x: string]: any;
}

interface IAuthKit {
  authorize(params?: IAuthorizeParams): Promise<IAuthKit>;
  getTokens(): Optional<Tokens>;
  getUserinfo(): Optional<IUserinfo>;
  setRequired(): void;
  redirect(): Promise<void>;
}

const storageFlowKey = 'authkit.storage.flow';
const storageTokensKey = 'authkit.storage.tokens';
const storageUserinfoKey = 'authkit.storage.userinfo';

const codeKey = 'code';
const errorCategoryKey = 'error';
const errorDescriptionKey = 'error_description';

const randomStringDefault = (length: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const getQueryDefault = (): string => location.search;
const submitFormDefault = (form: HTMLFormElement): void => {
  form.submit();
};
const redirectDefault = (url: string): void => {
  window.location.assign(url);
};

class AuthKit implements IAuthKit {
  // Visible for testing
  public randomString: (length: number) => string = randomStringDefault;

  // Visible for testing
  public getQuery: () => string = getQueryDefault;

  // Visible for testing
  public refreshLimit: number = -1;

  // Visible for testing
  public localRedirect: (url: string) => void = redirectDefault;

  // Visible for testing
  public submitForm: (form: HTMLFormElement) => void = submitFormDefault;

  private refreshCount = 0;

  private params: ICreateParams;
  private pkceSource: PkceSource;
  private tokens?: Tokens;
  private userinfo?: IUserinfo;
  private requireAuthentication?: boolean;

  private bindings: Map<
    string,
    (storage: IStorage, state: Optional<string>, extensions: Optional<any>) => Promise<void>
  >;

  constructor(params: ICreateParams, pkceSource: PkceSource) {
    this.params = params;
    this.pkceSource = pkceSource;
    this.bindings = new Map<
      string,
      (storage: IStorage, state: Optional<string>, extensions: Optional<any>) => Promise<void>
    >();

    this.bindings.set('get', async (storage: IStorage, state: Optional<string>, extensions: Optional<any>) => {
      const p = this.params!;
      this.localRedirect(
        `${p.issuer}/authorize?client_id=${p.clientId}&redirect_uri=${encodeURIComponent(
          storage.thisUri,
        )}${((): string => {
          if (state) {
            return `&state=${state}`;
          } else {
            return '';
          }
        })()}&nonce=${storage.nonce}&response_type=code&scope=${encodeURIComponent(
          p.scope.join(' '),
        )}&code_challenge=${encodeURIComponent(storage.pkce.challenge)}`,
      );
    });

    // TODO - Need some unit tesing around this
    this.bindings.set('post', async (storage: IStorage, state: Optional<string>, extensions: Optional<any>) => {
      const p = this.params!;

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${p.issuer}/authorize`;
      form.style.display = 'none';

      const addField = (name: string, value: string) => {
        const f = document.createElement('input');
        f.type = 'hidden';
        f.name = name;
        f.value = value;
        form.appendChild(f);
      };

      addField('client_id', p.clientId);
      addField('redirect_uri', storage.thisUri);
      if (state) {
        addField('state', state);
      }
      addField('nonce', storage.nonce);
      addField('response_type', 'code');
      addField('scope', p.scope.join(' '));
      addField('code_challenge', storage.pkce.challenge);
      if (extensions) {
        addField('extensions', JSON.stringify(extensions));
      }

      document.body.appendChild(form);

      this.submitForm(form);
    });
  }

  public getTokens(): Optional<Tokens> {
    return this.tokens;
  }

  public getUserinfo(): Optional<IUserinfo> {
    return this.userinfo;
  }

  public async authorize(params: IAuthorizeParams = {}): Promise<IAuthKit> {
    if (await this.loadFromStorage()) {
      return Promise.resolve(this);
    }

    const q = queryString.parse(this.getQuery());
    const code = this.stringFromQuery(q, codeKey);
    const errorCategory = this.stringFromQuery(q, errorCategoryKey);
    const errorDescription = this.stringFromQuery(q, errorDescriptionKey) || '';

    if (errorCategory) {
      this.tokens = undefined;
      const $storage = await this.getStorage();
      if ($storage?.thisUri) {
        window.history.pushState('page', '', $storage.thisUri);
      }
      throw new Error(`[${errorCategory}] ${errorDescription}`);
    }

    if (code) {
      await this.loadFromCode(code);
      return Promise.resolve(this);
    }

    const storage = await this.createAndStoreStorage();
    if (this.requireAuthentication) {
      const binding = this.bindings.get(params.binding || 'get');
      if (!binding) {
        throw new Error(`Invalid binding ${params.binding}`);
      }
      await binding(storage, params.state, params.extensions);
    }
    return Promise.resolve(this);
  }

  public async redirect(params: IAuthorizeParams = {}): Promise<void> {
    if (this.requireAuthentication) {
      throw new Error('Redirecting not allowed when provider requires authentication.');
    }

    const storage: Optional<IStorage> = await this.getStorage();
    if (!storage) {
      throw new Error('Storage has not been created');
    }

    const binding = this.bindings.get(params.binding || 'get');
    if (!binding) {
      throw new Error(`Invalid binding get`);
    }

    await binding(storage, params.state, params.extensions);
  }

  public setRequired(): void {
    this.requireAuthentication = true;
  }
  private stringFromQuery(q: queryString.ParsedQuery<string>, name: string): string | undefined {
    const raw = q[name];

    if (typeof raw === 'string') {
      return raw;
    }
    return undefined;
  }

  private async loadFromCode(code: string) {
    const storage = await this.getStorage();

    if (!storage) {
      throw new Error('Nothing in storage');
    }

    const res = await axios.post(
      this.params!.issuer + '/oauth/token',
      queryString.stringify({
        client_id: this.params.clientId,
        code,
        code_verifier: storage.pkce.verifier,
        grant_type: 'authorization_code',
        redirect_uri: storage.thisUri,
      }),
      {
        adapter: require('axios/lib/adapters/xhr'),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    const resp = res.data;

    try {
      await this.processTokenResponse(resp);
    } finally {
      window.history.pushState('page', '', storage.thisUri);
    }
  }

  private async processTokenResponse(resp: any) {
    if (resp.error) {
      this.tokens = undefined;
      throw new Error(`[${resp.error}] ${resp.error_description}`);
    }

    if (resp.access_token) {
      this.tokens = {
        accessToken: resp.access_token,
        expiresIn: resp.expires_in,
        idToken: resp.id_token,
        refreshToken: resp.refresh_token,
      };
      // Only need to load this once
      if (!this.userinfo) {
        await this.loadUserinfo();
      }
      await this.finalStorage(this.tokens!, this.userinfo!);

      this.refreshLoop(this);
    }
  }

  private refreshLoop(that: AuthKit) {
    // seconds -> milliseconds
    const interval = (that.tokens!.expiresIn - 30) * 1000;

    setTimeout(async function refresh() {
      if (that.refreshLimit === -1 || that.refreshLimit >= that.refreshCount) {
        await that.refresh(that);
        that.refreshCount++;
      }
    }, interval);
  }

  private async refresh(that: AuthKit) {
    const res = await axios.post(
      that.params!.issuer + '/oauth/token',
      queryString.stringify({
        grant_type: 'refresh_token',
        refresh_token: that.tokens!.refreshToken,
      }),
      {
        adapter: require('axios/lib/adapters/xhr'),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    const resp = res.data;

    that.processTokenResponse(resp);
  }

  private async loadUserinfo(): Promise<void> {
    if (this.userinfo) {
      return;
    }

    if (!this.tokens) {
      throw new Error('Not authenticated');
    }

    const resp = await axios.get(
      this.params!.issuer + '/userinfo?client_id=' + encodeURIComponent(this.params.clientId),
      {
        headers: {
          Authorization: 'Bearer ' + this.tokens.accessToken,
        },
      },
    );

    this.userinfo = resp.data;
  }

  private async getStorage(): Promise<Optional<IStorage>> {
    const raw = sessionStorage.getItem(storageFlowKey);
    if (raw == null) {
      return undefined;
    }
    return JSON.parse(raw);
  }

  private async createAndStoreStorage(): Promise<IStorage> {
    let thisUri = window.location.href;
    if (thisUri.indexOf('#') > 0) {
      thisUri = thisUri.substring(0, thisUri.indexOf('#'));
    }
    const storage: IStorage = {
      nonce: this.randomString(32),
      pkce: this.pkceSource.create(),
      thisUri,
    };
    sessionStorage.setItem(storageFlowKey, JSON.stringify(storage));
    return storage;
  }

  private async finalStorage(authentication: Tokens, userinfo: IUserinfo) {
    sessionStorage.setItem(storageTokensKey, JSON.stringify(authentication));
    sessionStorage.setItem(storageUserinfoKey, JSON.stringify(userinfo));
    sessionStorage.removeItem(storageFlowKey);
  }

  private async loadFromStorage(): Promise<boolean> {
    const authString = sessionStorage.getItem(storageTokensKey);
    const userinfoString = sessionStorage.getItem(storageUserinfoKey);
    if (authString && userinfoString) {
      this.tokens = JSON.parse(authString);
      this.userinfo = JSON.parse(userinfoString);
      this.refreshLoop(this);
      return true;
    } else {
      return false;
    }
  }
}

export { IAuthKit, IAuthorizeParams, ICreateParams, IUserinfo, AuthKit, randomStringDefault };

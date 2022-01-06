import { Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import axios from 'axios';
import 'jest-localstorage-mock';
import * as queryString from 'query-string';
import { Optional } from '../Lang';
import { PkceSource } from '../Pkce';
import { ICreateParams, IUserinfo, randomStringDefault, AuthKit } from '../AuthKit';
import '@testing-library/jest-dom';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

const pushStateMock = jest.fn();

beforeAll(() => {
  history.pushState = pushStateMock;
  jest.useFakeTimers();
});

beforeEach(() => {
  pushStateMock.mockReset();
  sessionStorage.clear();
});

describe('randomStringDefault', () => {
  it('generates correct random values', () => {
    const results = new Map<string, boolean>();
    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
      let s = randomStringDefault(32);
      expect(s).toMatch(/^[A-Za-z0-9]{32}$/);
      results.set(s, true);
    }
    expect(results.size).toBe(iterations);
  });
});

describe('AuthKit', () => {
  const storageFlowKey = 'authkit.storage.flow';
  const storageTokensKey = 'authkit.storage.tokens';
  const storageUserinfoKey = 'authkit.storage.userinfo';

  const errorCategory = 'test-error';
  const errorDescription = 'test-error-description';

  const issuer = 'https://test-issuer';
  const clientId = 'test-client-id';
  const scope = ['scope1', 'scope2'];

  const verifier = 'test-verifier';
  const challenge = 'test-challenge';
  const code = 'test-code';
  const state = 'test-state';
  const nonce = 'test-nonce';

  let query = '';

  const thisUri = 'http://test-uri';
  const refreshToken = 'test-refresh-token';
  const idToken = 'test-id-token';
  const expiresIn = 7200;
  const accessToken = 'test-access-token';
  const accessToken2 = 'test-access-token-2';

  const sub = 'test-sub';
  const lastName = 'test-lastname';
  const sub2 = 'test-sub-2';
  const lastName2 = 'test-lastname-2';

  const tokens = {
    accessToken,
    expiresIn,
    idToken,
    refreshToken,
  };

  const tokens2 = {
    accessToken: accessToken2,
    expiresIn,
    idToken,
    refreshToken,
  };

  const userinfo: IUserinfo = {
    lastName,
    sub,
  };

  const userinfo2: IUserinfo = {
    lastName: lastName2,
    sub: sub2,
  };

  let pkceSource: SubstituteOf<PkceSource>;

  let unit: AuthKit;
  let error: Optional<Error>;

  const params = (): ICreateParams => {
    return {
      clientId,
      issuer,
      scope,
    };
  };

  const makeUnit = (): AuthKit => {
    const $unit = new AuthKit(params(), pkceSource);
    $unit.randomString = (length: number) => `stub-${length}`;
    $unit.getQuery = () => query;
    $unit.redirect = (url: string) => (redirectTo = url);
    $unit.refreshLimit = 3;
    return $unit;
  };

  let redirectTo: string;

  beforeEach(async () => {
    redirectTo = '';
    query = '';
    error = undefined;
    pkceSource = Substitute.for<PkceSource>();
    sessionStorage.removeItem(storageFlowKey);
    unit = makeUnit();
  });

  describe('initial', () => {
    describe('no secure call', () => {
      it('has no authentication', () => {
        expect(unit.getTokens()).toBeUndefined();
      });
      it('has no userinfo', () => {
        expect(unit.getUserinfo()).toBeUndefined();
      });
      it('has no session storage', () => {
        expect(sessionStorage.__STORE__).toEqual({});
      });
      it('does not push state', () => {
        expect(pushStateMock.mock.calls.length).toBe(0);
      });
    });
  });

  describe('Manually set tokens', () => {
    beforeEach(() => {
      mockAxios.get.mockResolvedValue({
        data: userinfo2,
      });
    });
    describe('tokens and userinfo already in storage', () => {
      beforeEach(async () => {
        expect(unit.getTokens()).toBeUndefined();
        expect(await unit.setTokens(tokens)).toBeUndefined();
        mockAxios.get.mockResolvedValue({
          data: userinfo,
        });
        expect(await unit.setTokens(tokens2)).toBeUndefined();
      });
      it('updates tokens', () => {
        expect(unit.getTokens()).toEqual(tokens2);
      });
      it('does not update userinfo', () => {
        expect(unit.getUserinfo()).toEqual(userinfo2);
      });
    });
    describe('userinfo and tokens not in storage', () => {
      beforeEach(async () => {
        expect(unit.getTokens()).toBeUndefined();
        expect(await unit.setTokens(tokens)).toBeUndefined();
      });
      it('sets tokens', () => {
        expect(unit.getTokens()).toEqual(tokens);
      });
      it('sets userinfo', () => {
        expect(unit.getUserinfo()).toEqual(userinfo2);
      });
    });
  });

  describe('authorize', () => {
    describe('tokens and userinfo already in storage', () => {
      beforeEach(async () => {
        sessionStorage.__STORE__[storageTokensKey] = JSON.stringify(tokens);
        sessionStorage.__STORE__[storageUserinfoKey] = JSON.stringify(userinfo);
        expect(unit.getTokens()).toBeUndefined();
        expect(await unit.authorize()).toEqual(unit);
      });
      it('loads tokens from the session store', () => {
        expect(unit.getTokens()).toEqual(tokens);
      });
      it('loads userinfo from the session store', () => {
        expect(unit.getUserinfo()).toEqual(userinfo);
      });
      it('does not push state', () => {
        expect(pushStateMock.mock.calls.length).toBe(0);
      });
      it('does not have flow storage', () => {
        expect(sessionStorage.__STORE__[storageFlowKey]).toBeUndefined();
      });
      describe('successful refresh', () => {
        beforeEach(() => {
          mockAxios.post.mockReset();
          mockAxios.get.mockReset();
          pushStateMock.mockReset();
          mockAxios.post.mockResolvedValue({
            data: {
              access_token: accessToken2,
              id_token: idToken,
              expires_in: expiresIn,
              refresh_token: refreshToken,
              token_type: 'bearer',
            },
          });
          try {
            jest.runAllTimers();
          } catch (e) {
            error = e;
          }
        });

        it('does not throw an error', () => {
          expect(error).toBeUndefined();
        });
        it('sets new tokens', async () => {
          expect(unit.getTokens()).toEqual(tokens2);
        });
        it('leaves userinfo unchanged', async () => {
          expect(unit.getUserinfo()).toEqual(userinfo);
        });
        it('makes call to token endpoint', async () => {
          expect(mockAxios.post).toHaveBeenCalledWith(
            issuer + '/oauth/token',
            queryString.stringify({
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
            }),
            {
              adapter: require('axios/lib/adapters/xhr'),
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
          );
        });
        it('does not make call to userinfo endpoint', async () => {
          expect(mockAxios.get).not.toHaveBeenCalled();
        });
        it('does not push state', () => {
          expect(pushStateMock.mock.calls.length).toBe(0);
        });
        it('removes storage', () => {
          expect(sessionStorage.__STORE__[storageFlowKey]).toBeUndefined();
        });
        it('sets tokens in storage', () => {
          expect(sessionStorage.__STORE__[storageTokensKey]).toEqual(JSON.stringify(tokens2));
        });
        it('leaves userinfo to storage', () => {
          expect(sessionStorage.__STORE__[storageUserinfoKey]).toEqual(JSON.stringify(userinfo));
        });
      });
    });

    describe('authentication not in storage', () => {
      describe('minimal params', () => {
        beforeEach(async () => {
          pkceSource.create().returns({
            challenge,
            verifier,
          });
          expect(await unit.authorize()).toEqual(unit);
        });
        it('has no authentication', async () => {
          expect(unit.getTokens()).toBeUndefined();
        });
        it('has no userinfo', async () => {
          expect(unit.getUserinfo()).toBeUndefined();
        });
        it('redirected to the endpoint', () => {
          expect(redirectTo).toBe(
            `${issuer}/authorize?client_id=test-client-id&redirect_uri=${encodeURIComponent(
              window.location.href,
            )}&nonce=stub-32&response_type=code&scope=scope1%20scope2&code_challenge=test-challenge`,
          );
        });
        it('stores state and nonce', () => {
          expect(JSON.parse(sessionStorage.__STORE__[storageFlowKey])).toEqual({
            nonce: 'stub-32',
            pkce: {
              challenge,
              verifier,
            },
            thisUri: window.location.href,
          });
        });
        it('does not push state', () => {
          expect(pushStateMock.mock.calls.length).toBe(0);
        });
        it('does not have auth storage', () => {
          expect(sessionStorage.__STORE__[storageTokensKey]).toBeUndefined();
        });
        it('does not have userionfo storage', () => {
          expect(sessionStorage.__STORE__[storageUserinfoKey]).toBeUndefined();
        });
      });
      describe('with state', () => {
        beforeEach(async () => {
          pkceSource.create().returns({
            challenge,
            verifier,
          });
          expect(
            await unit.authorize({
              state: state,
            }),
          ).toEqual(unit);
        });
        it('redirected to the endpoint', () => {
          expect(redirectTo).toBe(
            `${issuer}/authorize?client_id=test-client-id&redirect_uri=${encodeURIComponent(
              window.location.href,
            )}&state=${state}&nonce=stub-32&response_type=code&scope=scope1%20scope2&code_challenge=test-challenge`,
          );
        });
      });
      describe('with post binding', () => {
        let form: HTMLFormElement;
        beforeEach(() => {
          unit.submitForm = ($form: HTMLFormElement) => {
            form = $form;
          };
          pkceSource.create().returns({
            challenge,
            verifier,
          });
        });
        describe('minimal params', () => {
          beforeEach(async () => {
            expect(
              await unit.authorize({
                binding: 'post',
              }),
            ).toEqual(unit);
          });
          it('performs a form post', () => {
            expect(form.method).toEqual('post');
            expect(form.action).toEqual(`${issuer}/authorize`);

            /*
            expect(form).toHaveFormValues({
              client_id: clientId,
            });
            */
            /*
        addField('redirect_uri', storage.thisUri)
        if (state) {
          addField('state', state);
        }
        addField('nonce', storage.nonce);
        addField('response_type', 'code');
        addField('scope', p.scope.join(' '))
        addField('code_challenge', storage.pkce.challenge)
        */
          });
        });
      });
    });

    describe('return with code without storage', () => {
      beforeEach(async () => {
        query = `?code=${code}`;
        try {
          expect(await unit.authorize()).toEqual(unit);
        } catch (e) {
          error = e;
        }
      });
      it('throws and error', () => {
        expect(error).toEqual(new Error('Nothing in storage'));
      });
      it('does not push state', () => {
        expect(pushStateMock.mock.calls.length).toBe(0);
      });
      it('does not have auth storage', () => {
        expect(sessionStorage.__STORE__[storageTokensKey]).toBeUndefined();
      });
      it('does not have userinfo storage', () => {
        expect(sessionStorage.__STORE__[storageUserinfoKey]).toBeUndefined();
      });
    });

    describe('return with oauth error message', () => {
      beforeEach(async () => {
        query = `?error=${errorCategory}&error_description=${errorDescription}`;
        sessionStorage.__STORE__[storageFlowKey] = JSON.stringify({
          thisUri,
        });
        try {
          await unit.authorize();
        } catch (e) {
          error = e;
        }
      });
      it('throws an error', () => {
        expect(error).toEqual(new Error(`[${errorCategory}] ${errorDescription}`));
      });
      it('pushes state after error', () => {
        expect(pushStateMock.mock.calls.length).toBe(1);
        expect(pushStateMock.mock.calls[0][2]).toBe(thisUri);
      });
      it('does not have auth storage', () => {
        expect(sessionStorage.__STORE__[storageTokensKey]).toBeUndefined();
      });
      it('does not have userinfo storage', () => {
        expect(sessionStorage.__STORE__[storageUserinfoKey]).toBeUndefined();
      });
    });

    describe('return with code with storage', () => {
      beforeEach(async () => {
        query = `?code=${code}`;
        sessionStorage.__STORE__[storageFlowKey] = JSON.stringify({
          nonce,
          pkce: {
            challenge,
            verifier,
          },
          thisUri,
        });
      });

      describe('server error', () => {
        beforeEach(async () => {
          const err = new Error('Host cannot be reached');
          try {
            mockAxios.post.mockRejectedValue(err);
            await unit.authorize();
            fail('Expected exception');
          } catch (e) {
            expect(e).toEqual(err);
          }
        });
        it('makes call to token endpoint', async () => {
          expect(mockAxios.post).toHaveBeenCalledWith(
            issuer + '/oauth/token',
            queryString.stringify({
              client_id: clientId,
              code,
              code_verifier: verifier,
              grant_type: 'authorization_code',
              redirect_uri: thisUri,
            }),
            {
              adapter: require('axios/lib/adapters/xhr'),
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
          );
        });
        it('does not push state', () => {
          expect(pushStateMock.mock.calls.length).toBe(0);
        });
        it('does not have auth storage', () => {
          expect(sessionStorage.__STORE__[storageTokensKey]).toBeUndefined();
        });
        it('does not have userinfo storage', () => {
          expect(sessionStorage.__STORE__[storageUserinfoKey]).toBeUndefined();
        });
      });

      describe('oauth error', () => {
        beforeEach(async () => {
          mockAxios.post.mockResolvedValue({
            data: {
              error: errorCategory,
              error_description: errorDescription,
            },
          });
          try {
            expect(await unit.authorize()).toEqual(unit);
          } catch (e) {
            error = e;
          }
        });
        it('throws an error', () => {
          expect(error).toEqual(new Error(`[${errorCategory}] ${errorDescription}`));
        });
        it('sets authentication to undefined', () => {
          expect(unit.getTokens()).toBeUndefined();
        });
        it('makes call to token endpoint', async () => {
          expect(mockAxios.post).toHaveBeenCalledWith(
            issuer + '/oauth/token',
            queryString.stringify({
              client_id: clientId,
              code,
              code_verifier: verifier,
              grant_type: 'authorization_code',
              redirect_uri: thisUri,
            }),
            {
              adapter: require('axios/lib/adapters/xhr'),
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
          );
        });
        it('pushes state after error', () => {
          expect(pushStateMock.mock.calls.length).toBe(1);
          expect(pushStateMock.mock.calls[0][2]).toBe(thisUri);
        });
        it('does not have auth storage', () => {
          expect(sessionStorage.__STORE__[storageTokensKey]).toBeUndefined();
        });
        it('does not have userinfo storage', () => {
          expect(sessionStorage.__STORE__[storageUserinfoKey]).toBeUndefined();
        });
      });
      describe('success', () => {
        beforeEach(async () => {
          mockAxios.post.mockResolvedValue({
            data: {
              access_token: accessToken,
              id_token: idToken,
              expires_in: expiresIn,
              refresh_token: refreshToken,
              token_type: 'bearer',
            },
          });
          mockAxios.get.mockResolvedValue({
            data: userinfo,
          });
          try {
            await unit.authorize();
          } catch (e) {
            error = e;
          }
        });
        it('does not throw an error', () => {
          expect(error).toBeUndefined();
        });
        it('sets authentication', async () => {
          expect(unit.getTokens()).toEqual(tokens);
        });
        it('sets userinfo', async () => {
          expect(unit.getUserinfo()).toEqual(userinfo);
        });
        it('makes call to token endpoint', async () => {
          expect(mockAxios.post).toHaveBeenCalledWith(
            issuer + '/oauth/token',
            queryString.stringify({
              client_id: clientId,
              code,
              code_verifier: verifier,
              grant_type: 'authorization_code',
              redirect_uri: thisUri,
            }),
            {
              adapter: require('axios/lib/adapters/xhr'),
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
          );
        });
        it('makes call to userinfo endpoint', async () => {
          expect(mockAxios.get).toHaveBeenCalledWith(issuer + '/userinfo?client_id=' + encodeURIComponent(clientId), {
            headers: { Authorization: 'Bearer ' + accessToken },
          });
        });
        it('pushes state to stored uri', () => {
          expect(pushStateMock.mock.calls.length).toBe(1);
          expect(pushStateMock.mock.calls[0][2]).toBe(thisUri);
        });
        it('removes storage', () => {
          expect(sessionStorage.__STORE__[storageFlowKey]).toBeUndefined();
        });
        it('sets authentication to storage', () => {
          expect(sessionStorage.__STORE__[storageTokensKey]).toEqual(JSON.stringify(tokens));
        });
        it('sets userinfo to storage', () => {
          expect(sessionStorage.__STORE__[storageUserinfoKey]).toEqual(JSON.stringify(userinfo));
        });

        describe('successful refresh', () => {
          beforeEach(() => {
            mockAxios.post.mockReset();
            mockAxios.get.mockReset();
            pushStateMock.mockReset();
            mockAxios.post.mockResolvedValue({
              data: {
                access_token: accessToken2,
                id_token: idToken,
                expires_in: expiresIn,
                refresh_token: refreshToken,
                token_type: 'bearer',
              },
            });
            try {
              jest.runAllTimers();
            } catch (e) {
              error = e;
            }
          });

          it('does not throw an error', () => {
            expect(error).toBeUndefined();
          });
          it('sets new authentication', async () => {
            expect(unit.getTokens()).toEqual(tokens2);
          });
          it('leaves userinfo unchanged', async () => {
            expect(unit.getUserinfo()).toEqual(userinfo);
          });
          it('makes call to token endpoint', async () => {
            expect(mockAxios.post).toHaveBeenCalledWith(
              issuer + '/oauth/token',
              queryString.stringify({
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
              }),
              {
                adapter: require('axios/lib/adapters/xhr'),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              },
            );
          });
          it('does not make call to userinfo endpoint', async () => {
            expect(mockAxios.get).not.toHaveBeenCalled();
          });
          it('does not pushe state', () => {
            expect(pushStateMock.mock.calls.length).toBe(0);
          });
          it('removes storage', () => {
            expect(sessionStorage.__STORE__[storageFlowKey]).toBeUndefined();
          });
          it('sets authentication in storage', () => {
            expect(sessionStorage.__STORE__[storageTokensKey]).toEqual(JSON.stringify(tokens2));
          });
          it('leaves userinfo to storage', () => {
            expect(sessionStorage.__STORE__[storageUserinfoKey]).toEqual(JSON.stringify(userinfo));
          });
        });
      });
    });
  });
  describe('logout', () => {
    const logoutUrl = `${issuer}/logout?return_to=/`;
    const oldWL = window.location;

    beforeAll(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { replace: jest.fn() },
      });
    });
    afterAll(() => {
      Object.defineProperty(window, 'location', { configurable: true, value: oldWL });
    });
    beforeEach(() => {
      window.location.replace = jest.fn();
      sessionStorage.__STORE__[storageTokensKey] = JSON.stringify(tokens);
      unit.logout('/');
    });

    it('removes tokens in storage', () => {
      expect(sessionStorage.__STORE__[storageTokensKey]).toBeUndefined();
    });
    it('redirects to the logout url', () => {
      expect(window.location.replace).toHaveBeenCalledTimes(1);
      expect(window.location.replace).toHaveBeenCalledWith(logoutUrl);
    });
  });
});

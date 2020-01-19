import { Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import axios from 'axios';
import 'jest-localstorage-mock';
import * as queryString from 'query-string';
import { Optional } from '../Lang';
import { PkceSource } from '../Pkce';
import { IParams, randomStringDefault, SecureImpl } from '../Secure';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
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

describe('SecureImpl', () => {
  const storageKey = 'authlogic.storage';

  const errorCategory = 'test-error';
  const errorDescription = 'test-error-description';

  const issuer = 'test-issuer';
  const clientId = 'test-client-id';
  const scope = 'test-scope';

  const verifier = 'test-verifier';
  const challenge = 'test-challenge';
  const code = 'test-code';
  const state = 'test-state';
  const nonce = 'test-nonce';

  let query = '';

  const refreshToken = 'test-refresh-token';
  const idToken = 'test-id-token';
  const expiresIn = 7200;
  const accessToken = 'test-access-token';

  let pkceSource: SubstituteOf<PkceSource>;

  let unit: SecureImpl;
  let error: Optional<Error>;

  const params = (): IParams => {
    return {
      clientId,
      issuer,
      scope,
    };
  };

  const makeUnit = (): SecureImpl => {
    const $unit = new SecureImpl(pkceSource);
    $unit.randomString = (length: number) => `stub-${length}`;
    $unit.getQuery = () => query;
    return $unit;
  };

  let redirectTo: string;

  beforeEach(async () => {
    redirectTo = '';
    query = '';
    error = undefined;
    pkceSource = Substitute.for<PkceSource>();
    window.location.assign = jest.fn(value => {
      redirectTo = value;
    });
    sessionStorage.removeItem(storageKey);
    unit = makeUnit();
  });

  describe('initial', () => {
    describe('secure', () => {
      it('throws an exception', async () => {
        try {
          await unit.secure();
          fail('Exception should have been thrown');
        } catch (e) {
          expect(e.message).toBe('Secure object not initizlied. Please call init');
        }
      });
    });
  });

  describe('with init', () => {
    beforeEach(() => {
      unit.init(params());
    });
    describe('no secure call', () => {
      it('has no authentication', async () => {
        expect(unit.getAuthentication()).toBeUndefined();
      });
      it('has no session storage', () => {
        expect(sessionStorage.__STORE__).toEqual({});
      });
    });

    describe('secure', () => {
      describe('redirect', () => {
        beforeEach(async () => {
          pkceSource.create().returns({
            challenge,
            verifier,
          });
          await unit.secure();
        });
        it('has no authentication', async () => {
          expect(unit.getAuthentication()).toBeUndefined();
        });
        it('redirected to the endpoint', () => {
          expect(redirectTo).toBe(
            `test-issuer/authorize?client_id=test-client-id&redirect_uri=${encodeURIComponent(
              window.location.href,
            )}&state=stub-32&nonce=stub-32&response_type=code&scope=test-scope&code_challenge=test-challenge`,
          );
        });
        it('stores state and nonce', () => {
          expect(JSON.parse(sessionStorage.__STORE__[storageKey])).toEqual({
            nonce: 'stub-32',
            pkce: {
              challenge,
              verifier,
            },
            state: 'stub-32',
          });
        });
      });

      describe('return with code without storage', () => {
        it('throws an error', async () => {
          query = `?code=${code}`;
          try {
            await unit.secure();
            fail('Expected an error');
          } catch (e) {
            expect(e).toEqual(new Error('Nothing in storage'));
          }
        });
      });

      describe('return with oauth error message', () => {
        beforeEach(async () => {
          query = `?error=${errorCategory}&error_description=${errorDescription}`;
          try {
            await unit.secure();
          } catch (e) {
            error = e;
          }
        });
        it('throws an error', () => {
          expect(error).toEqual(new Error(`[${errorCategory}] ${errorDescription}`));
        });
      });

      describe('return with code and storage', () => {
        beforeEach(async () => {
          query = `?code=${code}`;
          sessionStorage.__STORE__[storageKey] = JSON.stringify({
            nonce,
            pkce: {
              challenge,
              verifier,
            },
            state,
          });
        });

        describe('server error', () => {
          beforeEach(async () => {
            const err = new Error('Host cannot be reached');
            try {
              mockAxios.post.mockRejectedValue(err);
              await unit.secure();
              fail('Expected exception');
            } catch (e) {
              expect(e).toEqual(err);
            }
          });
          it('makes call to token endpoint', async () => {
            expect(mockAxios.post).toHaveBeenCalledWith(
              issuer + '/oauth/token',
              queryString.stringify({
                code,
                code_verifier: verifier,
                grant_type: 'authorization_code',
              }),
              {
                adapter: require('axios/lib/adapters/xhr'),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              },
            );
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
              await unit.secure();
            } catch (e) {
              error = e;
            }
          });
          it('throws an error', () => {
            expect(error).toEqual(new Error(`[${errorCategory}] ${errorDescription}`));
          });
          it('sets authentication to undefined', async () => {
            expect(await unit.getAuthentication()).toBeUndefined();
          });
          it('makes call to token endpoint', async () => {
            expect(mockAxios.post).toHaveBeenCalledWith(
              issuer + '/oauth/token',
              queryString.stringify({
                code,
                code_verifier: verifier,
                grant_type: 'authorization_code',
              }),
              {
                adapter: require('axios/lib/adapters/xhr'),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              },
            );
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
            try {
              await unit.secure();
            } catch (e) {
              error = e;
            }
          });
          it('does not throw an error', () => {
            expect(error).toBeUndefined();
          });
          it('sets authentication', async () => {
            expect(await unit.getAuthentication()).toEqual({
              accessToken,
              expiresIn,
              idToken,
              refreshToken,
            });
          });
          it('makes call to token endpoint', async () => {
            expect(mockAxios.post).toHaveBeenCalledWith(
              issuer + '/oauth/token',
              queryString.stringify({
                code,
                code_verifier: verifier,
                grant_type: 'authorization_code',
              }),
              {
                adapter: require('axios/lib/adapters/xhr'),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              },
            );
          });
        });
      });
    });
  });
});

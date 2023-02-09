import { IMock, Mock } from 'moq.ts';
import { Authentication, IAuthenticationState } from '../src/Authentication';
import { AuthKit, ICreateParams, IQueryParamSupplier } from '../src/AuthKit';
import { IPkceSource } from '../src/Pkce';
import { IAuthorizeParams, IStorage } from '../src/Types';
import { Api } from '../src/Api';

describe('AuthKit', () => {
  const clientId = 'test-client-id';
  const issuer = 'test-issuer';
  const accessToken = 'test-access-token';
  const code = 'test-code';
  const state = 'test-state';
  const params: IAuthorizeParams = {
    scope: ['a'],
  };
  const stateExists: IAuthenticationState = {
    expiresIn: Date.now(),
    tokens: {
      accessToken,
      expiresIn: 123,
    },
  };
  let sMock: IMock<IStorage>;
  let psMock: IMock<IPkceSource>;
  let qpsMock: IMock<IQueryParamSupplier>;
  let apMock: IMock<Api>;
  let aMock: IMock<Authentication>;
  const makeUnit = (createParams: ICreateParams): AuthKit => {
    const unit = new AuthKit(createParams, apMock.object(), sMock.object(), psMock.object(), qpsMock.object());
    unit.newAuthentication = (): Authentication => {
      return aMock.object();
    };
    return unit;
  };
  beforeEach(() => {
    sMock = new Mock<IStorage>();
    psMock = new Mock<IPkceSource>();
    qpsMock = new Mock<IQueryParamSupplier>();
    aMock = new Mock<Authentication>();
    apMock = new Mock<Api>();
  });
  describe('authorize', () => {
    test('state exists and authenticated', async () => {
      sMock = sMock.setup(i => i.getItem('__authkit.storage.authentication')).returns(JSON.stringify(stateExists));
      aMock = aMock.setup(i => i.isAuthenticated()).returns(true);
      const unit = makeUnit({ clientId, issuer });
      const got = await unit.authorize(params);
      expect(got).toBe(aMock.object());
    });
    test('state not exists code passed with state no stored state', async () => {
      sMock = sMock.setup(i => i.getItem('__authkit.storage.authentication')).returns(null);
      qpsMock = qpsMock
        .setup(i => i('code'))
        .returns(code)
        .setup(i => i('state'))
        .returns(state);
      const unit = makeUnit({ clientId, issuer });
      await expect(async () => await unit.authorize(params)).rejects.toThrow(new Error('no stored conversation state'));
    });
  });
});

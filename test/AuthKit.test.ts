import { IMock, It, Mock } from 'moq.ts';
import { Authentication, IAuthenticationState } from '../src/Authentication';
import { AuthKit, IConversationState, ICreateParams, IQueryParamSupplier } from '../src/AuthKit';
import { IPkceSource } from '../src/Pkce';
import { IAuthorizeParams, IStorage } from '../src/Types';
import { Api, IGetTokensRequest } from '../src/Api';
import { ITokens } from '../src/Tokens';
import { IFrame } from '../src/IFrame';

const authenticationKey = '__authkit.storage.authentication';
const conversationKey = '__authkit.storage.conversation';
describe('AuthKit', () => {
  const clientId = 'test-client-id';
  const issuer = 'test-issuer';
  const accessToken = 'test-access-token';
  const code = 'test-code';
  const state = 'test-state';
  const codeVerifier = 'test-verifier';
  const nonce = 'test-nonce';
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
  const tokens: ITokens = {
    accessToken,
    expiresIn: 1234,
  };
  let sMock: IMock<IStorage>;
  let psMock: IMock<IPkceSource>;
  let qpsMock: IMock<IQueryParamSupplier>;
  let apMock: IMock<Api>;
  let aMock: IMock<Authentication>;
  let ifMock: IMock<IFrame>;
  const makeUnit = (createParams: ICreateParams): AuthKit => {
    const unit = new AuthKit(
      createParams,
      apMock.object(),
      sMock.object(),
      psMock.object(),
      qpsMock.object(),
      ifMock.object(),
    );
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
    ifMock = new Mock<IFrame>();
  });
  describe('authorize', () => {
    const conversationState: IConversationState = {
      codeVerifier,
      nonce,
    };
    // TODO - test expired state
    test('state exists and authenticated', async () => {
      sMock = sMock.setup(i => i.getItem(authenticationKey)).returns(JSON.stringify(stateExists));
      aMock = aMock.setup(i => i.isAuthenticated()).returns(true);
      const unit = makeUnit({ clientId, issuer });
      const got = await unit.authorize(params);
      expect(got).toBe(aMock.object());
    });
    // Pairwise testing for unautenticated state
    test('state exists not authenticated no refresh token no redirect handler', async () => {
      sMock = sMock.setup(i => i.getItem(authenticationKey)).returns(JSON.stringify(stateExists));
      aMock = aMock
        .setup(i => i.isAuthenticated())
        .returns(false)
        .setup(i => i.getRefreshToken())
        .returns(undefined);
      qpsMock = qpsMock
        .setup(i => i('code'))
        .returns(code)
        .setup(i => i('state'))
        .returns(state);
      const unit = makeUnit({ clientId, issuer });
      await expect(async () => await unit.authorize(params)).rejects.toThrow(
        new Error('redirect handler not provided'),
      );
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
    test('state not exists code passed with state success', async () => {
      sMock = sMock
        .setup(i => i.getItem(authenticationKey))
        .returns(null)
        .setup(i => i.getItem(conversationKey))
        .returns(JSON.stringify(conversationState));
      qpsMock = qpsMock
        .setup(i => i('code'))
        .returns(code)
        .setup(i => i('state'))
        .returns(state);
      apMock = apMock
        .setup(async i =>
          i.getTokens(
            It.Is<IGetTokensRequest>(r => {
              return r.clientId === clientId && r.codeVerifier === codeVerifier;
            }),
          ),
        )
        .returnsAsync(tokens);
      sMock = sMock.setup(i => i.setItem(authenticationKey, JSON.stringify(aMock.object()))).returns();
      const unit = makeUnit({ clientId, issuer });
      expect(await unit.authorize(params)).toBe(aMock.object());
    });
    test('state not exists no code passed silent not authentication', async () => {
      sMock = sMock.setup(i => i.getItem(authenticationKey)).returns(null);
      qpsMock = qpsMock.setup(i => i('code')).returns(undefined);
      ifMock = ifMock.setup(async i => i.getTokens(params)).returnsAsync(tokens);
      const unit = makeUnit({ clientId, issuer });
      expect(await unit.authorize({ mode: 'silent', ...params })).toBe(aMock.object());
    });
  });
});

import * as _ from 'lodash';
import { IMock, It, Mock } from 'moq.ts';
import { ITokens } from '../src';
import { Api, IGetTokensRequest } from '../src/Api';
import { Authentication, IAuthenticationState } from '../src/Authentication';
import { AuthKit, IConversationState, ICreateParams, IQueryParamSupplier } from '../src/AuthKit';
import { IFrame } from '../src/IFrame';
import { IPkce, IPkceSource } from '../src/Pkce';
import { IAuthorizeParams, IRedirectHandler, IStorage } from '../src/Types';
import { IAuthorizeUrlParams } from '../src/Urls';

const authenticationKey = '__authkit.storage.authentication';
const conversationKey = '__authkit.storage.conversation';
describe('AuthKit', () => {
  const clientId = 'test-client-id';
  const issuer = 'https://test-issuer';
  const accessToken = 'test-access-token';
  const code = 'test-code';
  const state = 'test-state';
  const codeVerifier = 'test-verifier';
  const nonce = 'test-nonce';
  const params: IAuthorizeParams = {
    scope: ['a'],
    redirectUri: '',
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
  const pcke: IPkce = {
    challenge: 'test-challenge',
    verifier: 'test-verifier',
  };
  const randomString = 'random-string';
  let sMock: IMock<IStorage>;
  let psMock: IMock<IPkceSource>;
  let qpsMock: IMock<IQueryParamSupplier>;
  let apMock: IMock<Api>;
  let aMock: IMock<Authentication>;
  let ifMock: IMock<IFrame>;
  let rhMock: IMock<IRedirectHandler>;
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
    unit.randomString = () => randomString;
    return unit;
  };
  beforeEach(() => {
    sMock = new Mock<IStorage>();
    psMock = new Mock<IPkceSource>();
    qpsMock = new Mock<IQueryParamSupplier>();
    aMock = new Mock<Authentication>();
    apMock = new Mock<Api>();
    ifMock = new Mock<IFrame>();
    rhMock = new Mock<IRedirectHandler>();
  });
  describe('authorize', () => {
    const conversationState: IConversationState = {
      codeVerifier,
      nonce,
      redirectUri: '',
    };
    // TODO - test expired state
    test('state exists and authenticated', async () => {
      sMock = sMock.setup(i => i.getItem(authenticationKey)).returns(JSON.stringify(stateExists));
      aMock = aMock.setup(i => i.isAuthenticated()).returns(true);
      const unit = makeUnit({ clientId, issuer });
      const got = await unit.authorize(params);
      expect(got).toBe(aMock.object());
    });
    // Pairwise testing for unauthenticated state
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
    test('state not exists no code passed silent not authenticated', async () => {
      sMock = sMock.setup(i => i.getItem(authenticationKey)).returns(null);
      qpsMock = qpsMock.setup(i => i('code')).returns(undefined);
      ifMock = ifMock
        .setup(async i =>
          i.getTokens(
            It.Is<IAuthorizeUrlParams>(r => {
              const val = _.isEqual(r, {
                issuer,
                clientId,
                scope: 'a',
                prompt: 'no_prompt',
                responseMode: 'web_message',
              });
              return val;
            }),
          ),
        )
        .returnsAsync(tokens);
      sMock = sMock
        .setup(i =>
          i.setItem(
            authenticationKey,
            It.Is<string>(r => {
              const obj = JSON.parse(r);
              return _.isEqual(obj.tokens, tokens) && obj.expiresIn > 0;
            }),
          ),
        )
        .returns();
      const unit = makeUnit({ clientId, issuer });
      expect(await unit.authorize({ mode: 'silent', ...params })).toBe(aMock.object());
    });
    test('state not exists no code passed redirect', async () => {
      sMock = sMock.setup(i => i.getItem(authenticationKey)).returns(null);
      qpsMock = qpsMock.setup(i => i('code')).returns(undefined);
      psMock = psMock.setup(i => i.create()).returns(pcke);
      sMock = sMock
        .setup(i =>
          i.setItem(
            conversationKey,
            It.Is<string>(r => {
              const t = _.isEqual(JSON.parse(r), {
                codeVerifier: pcke.verifier,
                nonce: randomString,
                redirectUri: '',
              });
              return t;
            }),
          ),
        )
        .returns();
      const unit = makeUnit({ clientId, issuer, redirectHandler: rhMock.object() });
      expect(await unit.authorize(params)).toBeUndefined();
      rhMock = rhMock.verify(i =>
        i(
          'https://test-issuer/authorize?client_id=test-client-id&code_challenge=test-challenge&code_challenge_method=S256',
        ),
      );
    });
    test('state not exists no code passed with redirectUri', async () => {
      sMock = sMock.setup(i => i.getItem(authenticationKey)).returns(null);
      qpsMock = qpsMock.setup(i => i('code')).returns(undefined);
      psMock = psMock.setup(i => i.create()).returns(pcke);
      sMock = sMock
        .setup(i =>
          i.setItem(
            conversationKey,
            It.Is<string>(r => {
              const t = _.isEqual(JSON.parse(r), {
                codeVerifier: pcke.verifier,
                nonce: randomString,
                redirectUri: '',
              });
              return t;
            }),
          ),
        )
        .returns();
      const unit = makeUnit({ clientId, issuer, redirectHandler: rhMock.object() });
      expect(await unit.authorize({ ...params, redirectUri: 'testuri.com', state: 'teststate' })).toBeUndefined();
      rhMock = rhMock.verify(i =>
        i(
          'https://test-issuer/authorize?client_id=test-client-id&code_challenge=test-challenge&code_challenge_method=S256&state=teststate&redirect_uri=testuri.com',
        ),
      );
    });
  });
});

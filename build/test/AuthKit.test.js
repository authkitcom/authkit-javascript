"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moq_ts_1 = require("moq.ts");
const AuthKit_1 = require("../src/AuthKit");
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
    const params = {
        scope: ['a'],
    };
    const stateExists = {
        expiresIn: Date.now(),
        tokens: {
            accessToken,
            expiresIn: 123,
        },
    };
    const tokens = {
        accessToken,
        expiresIn: 1234,
    };
    let sMock;
    let psMock;
    let qpsMock;
    let apMock;
    let aMock;
    let ifMock;
    const makeUnit = (createParams) => {
        const unit = new AuthKit_1.AuthKit(createParams, apMock.object(), sMock.object(), psMock.object(), qpsMock.object(), ifMock.object());
        unit.newAuthentication = () => {
            return aMock.object();
        };
        return unit;
    };
    beforeEach(() => {
        sMock = new moq_ts_1.Mock();
        psMock = new moq_ts_1.Mock();
        qpsMock = new moq_ts_1.Mock();
        aMock = new moq_ts_1.Mock();
        apMock = new moq_ts_1.Mock();
        ifMock = new moq_ts_1.Mock();
    });
    describe('authorize', () => {
        const conversationState = {
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
            await expect(async () => await unit.authorize(params)).rejects.toThrow(new Error('redirect handler not provided'));
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
                .setup(async (i) => i.getTokens(moq_ts_1.It.Is(r => {
                return r.clientId === clientId && r.codeVerifier === codeVerifier;
            })))
                .returnsAsync(tokens);
            sMock = sMock.setup(i => i.setItem(authenticationKey, JSON.stringify(aMock.object()))).returns();
            const unit = makeUnit({ clientId, issuer });
            expect(await unit.authorize(params)).toBe(aMock.object());
        });
        test('state not exists no code passed silent not authentication', async () => {
            sMock = sMock.setup(i => i.getItem(authenticationKey)).returns(null);
            qpsMock = qpsMock.setup(i => i('code')).returns(undefined);
            ifMock = ifMock.setup(async (i) => i.getTokens(params)).returnsAsync(tokens);
            const unit = makeUnit({ clientId, issuer });
            expect(await unit.authorize({ mode: 'silent', ...params })).toBe(aMock.object());
        });
    });
});
//# sourceMappingURL=AuthKit.test.js.map
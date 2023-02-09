"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moq_ts_1 = require("moq.ts");
const AuthKit_1 = require("../src/AuthKit");
describe('AuthKit', () => {
    const clientId = 'test-client-id';
    const issuer = 'test-issuer';
    const accessToken = 'test-access-token';
    const code = 'test-code';
    const state = 'test-state';
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
    let sMock;
    let psMock;
    let qpsMock;
    let apMock;
    let aMock;
    const makeUnit = (createParams) => {
        const unit = new AuthKit_1.AuthKit(createParams, apMock.object(), sMock.object(), psMock.object(), qpsMock.object());
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
//# sourceMappingURL=AuthKit.test.js.map
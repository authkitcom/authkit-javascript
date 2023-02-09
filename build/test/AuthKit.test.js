"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moq_ts_1 = require("moq.ts");
const AuthKit_1 = require("../src/AuthKit");
describe('AuthKit', () => {
    const clientId = 'test-client-id';
    const issuer = 'test-issuer';
    let sMock;
    let psMock;
    let qpsMock;
    const makeUnit = (params) => {
        return new AuthKit_1.AuthKit(params, sMock.object(), psMock.object(), qpsMock.object());
    };
    beforeEach(() => {
        sMock = new moq_ts_1.Mock();
        psMock = new moq_ts_1.Mock();
        qpsMock = new moq_ts_1.Mock();
    });
    describe('authorize', () => {
        test('state exists', async () => {
            const unit = makeUnit({ clientId, issuer });
            await unit.authorize();
        });
    });
});
//# sourceMappingURL=AuthKit.test.js.map
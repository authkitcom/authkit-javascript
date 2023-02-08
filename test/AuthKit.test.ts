import { IMock, Mock } from 'moq.ts';
import { AuthKit, ICreateParams } from '../src/AuthKit';
import { Optional } from '../src/Lang';
import { IPkceSource } from '../src/Pkce';
import { IStorage } from '../src/Types';
import { IAuthenticationState } from '../src/Authentication';

describe('AuthKit', () => {
  const clientId = 'test-client-id';
  const issuer = 'test-issuer';
  let sMock: IMock<IStorage>;
  let psMock: IMock<IPkceSource>;
  let asMock: IMock<IAuthenticationState>;
  let qpsMock: IMock<(name: string) => Optional<string>>;
  const makeUnit = (params: ICreateParams): AuthKit => {
    return new AuthKit(params, sMock.object(), psMock.object(), qpsMock.object());
  };
  beforeEach(() => {
    sMock = new Mock<IStorage>();
    psMock = new Mock<IPkceSource>();
    asMock = new Mock<IAuthenticationState>();
    qpsMock = new Mock<(name: string) => Optional<string>>();
  });
  describe('authorize', () => {
    test('state exists', async () => {
      sMock = sMock
        .setup(instance => instance.getItem('__authkit.storage.authentication'))
        .returns(JSON.stringify(asMock.object()));
      const unit = makeUnit({ clientId, issuer });
      await unit.authorize();
    });
  });
});

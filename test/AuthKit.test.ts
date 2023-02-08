import { Mock } from 'moq.ts';
import { AuthKit, ICreateParams } from '../src/AuthKit';
import { IStorage } from '../src/Types';
import { Optional } from '../src/Lang';
import { IPkceSource } from '../src/Pkce';

describe('AuthKit', () => {
  const clientId = 'test-client-id';
  const issuer = 'test-issuer';
  let sMock: Mock<IStorage>;
  let psMock: Mock<IPkceSource>;
  let qpsMock: Mock<(name: string) => Optional<string>>;
  const makeUnit = (params: ICreateParams): AuthKit => {
    return new AuthKit(params, sMock.object(), psMock.object(), qpsMock.object());
  };
  beforeEach(() => {
    sMock = new Mock<IStorage>();
    psMock = new Mock<IPkceSource>();
    qpsMock = new Mock<(name: string) => Optional<string>>();
  });
  describe('authorize', () => {
    test('state exists', async () => {
      const unit = makeUnit({ clientId, issuer });
      await unit.authorize();
    });
  });
});

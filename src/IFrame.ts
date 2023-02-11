import { Optional } from './Lang';
import { ITokens } from './Tokens';
import { IAuthorizeUrlParams } from './Urls';

export class IFrame {
  //TODO use params
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getTokens(params: IAuthorizeUrlParams): Promise<Optional<ITokens>> {
    return undefined;
  }
}

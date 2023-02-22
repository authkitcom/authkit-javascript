import * as Cryptojs from 'crypto-js';
import { SHA256 } from 'crypto-js';
import * as base64 from 'crypto-js/enc-base64';

interface IPkce {
  challenge: string;
  verifier: string;
}

interface IPkceSource {
  create(): IPkce;
}

class PkceSource implements IPkceSource {
  public randomBuffer(): string {
    console.log('T9');
    return Cryptojs.lib.WordArray.random(32).toString(Cryptojs.enc.Base64);
  }

  public create(): IPkce {
    console.log('L10');
    const verifier = urlReplace(this.randomBuffer());
    const challenge = urlReplace(SHA256(verifier).toString(base64));

    return {
      challenge,
      verifier,
    };
  }
}

function urlReplace(input: string) {
  console.log('F009');
  return input
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export { IPkce, IPkceSource, PkceSource };

import { IPkce, PkceSource } from '../src/Pkce';

describe('PckeSource', () => {
  test('generates unique and correct strings', () => {
    const unit = new PkceSource();
    const iterations = 1000;
    const entires = new Map<IPkce, boolean>();

    for (let i = 0; i < iterations; i++) {
      entires.set(unit.create(), true);
    }

    expect(entires.size).toBe(iterations);
  });

  test('generates a correct pair', () => {
    const unit = new PkceSource();

    unit.randomBuffer = (): Buffer => {
      return Buffer.from('test-verifier');
    };

    const result = unit.create();

    expect(result).toEqual({
      challenge: 'Xy4z2k3vdPEL7_IN1u0R0AuTrvud4feLffzULBuEWfc',
      verifier: 'dGVzdC12ZXJpZmllcg',
    });
  });
});

import {
  synthesizeProgram,
  PBESynthesizer,
  deepEquals,
  StringTransformationDSL,
} from './pbe.js';

describe('FlashFill PBE Synthesizer (@intra/adapter)', () => {
  describe('Occam Shortest-Program & Generalization Tests', () => {
    it('synthesizes identity program for identical input/outputs', () => {
      const examples = [
        { input: 'alpha', output: 'alpha' },
        { input: 'beta', output: 'beta' },
        { input: 'gamma', output: 'gamma' },
        { input: 'delta', output: 'delta' },
        { input: 'epsilon', output: 'epsilon' },
      ];

      const res = synthesizeProgram(examples);
      expect(res).not.toBeNull();
      expect(res?.verified).toBe(true);
      expect(res?.program.depth).toBe(0);
      expect(res?.program.name).toBe('identity');
      expect(res?.program.execute('zeta')).toBe('zeta');
    });

    it('synthesizes atomic depth-1 transform: toUpperCase', () => {
      const examples = [
        { input: 'apple', output: 'APPLE' },
        { input: 'banana', output: 'BANANA' },
        { input: 'cherry', output: 'CHERRY' },
        { input: 'date', output: 'DATE' },
        { input: 'elderberry', output: 'ELDERBERRY' },
      ];

      const res = synthesizeProgram(examples);
      expect(res).not.toBeNull();
      expect(res?.verified).toBe(true);
      expect(res?.program.depth).toBe(1);
      expect(res?.program.execute('fig')).toBe('FIG');
    });

    it('synthesizes atomic depth-1 numeric scaling: x100 (dollars to cents)', () => {
      const examples = [
        { input: 4.99, output: 499 },
        { input: 12.5, output: 1250 },
        { input: 0.99, output: 99 },
        { input: 25.0, output: 2500 },
        { input: 100.0, output: 10000 },
      ];

      const res = synthesizeProgram(examples);
      expect(res).not.toBeNull();
      expect(res?.verified).toBe(true);
      expect(res?.program.execute(50.25)).toBe(5025);
    });

    it('synthesizes atomic depth-1 string splitting: extract first word', () => {
      const examples = [
        { input: 'Jane Doe', output: 'Jane' },
        { input: 'Alan Turing', output: 'Alan' },
        { input: 'Ada Lovelace', output: 'Ada' },
        { input: 'Grace Hopper', output: 'Grace' },
        { input: 'Claude Shannon', output: 'Claude' },
      ];

      const res = synthesizeProgram(examples);
      expect(res).not.toBeNull();
      expect(res?.verified).toBe(true);
      expect(res?.program.execute('John von Neumann')).toBe('John');
    });

    it('synthesizes depth-2 composition: trim then toUpperCase', () => {
      const examples = [
        { input: '  order_100  ', output: 'ORDER_100' },
        { input: ' payment_200 ', output: 'PAYMENT_200' },
        { input: ' refund_300', output: 'REFUND_300' },
        { input: 'charge_400  ', output: 'CHARGE_400' },
        { input: '  dispute_500 ', output: 'DISPUTE_500' },
      ];

      const res = synthesizeProgram(examples);
      expect(res).not.toBeNull();
      expect(res?.verified).toBe(true);
      expect(res?.program.depth).toBe(2);
      expect(res?.program.execute('  invoice_600 ')).toBe('INVOICE_600');
    });

    it('synthesizes depth-2 composition: getField and scale (amount dollars to cents)', () => {
      const examples = [
        { input: { amount: 10.5 }, output: 1050 },
        { input: { amount: 25.0 }, output: 2500 },
        { input: { amount: 0.99 }, output: 99 },
        { input: { amount: 100.2 }, output: 10020 },
        { input: { amount: 5.0 }, output: 500 },
      ];

      const res = synthesizeProgram(examples);
      expect(res).not.toBeNull();
      expect(res?.verified).toBe(true);
      expect(res?.program.depth).toBe(2);
      expect(res?.program.execute({ amount: 15.75 })).toBe(1575);
    });

    it('synthesizes depth-2 combinator: LastName, FirstName reformatting', () => {
      const examples = [
        { input: 'Jane Doe', output: 'Doe, Jane' },
        { input: 'Alan Turing', output: 'Turing, Alan' },
        { input: 'Ada Lovelace', output: 'Lovelace, Ada' },
        { input: 'Grace Hopper', output: 'Hopper, Grace' },
        { input: 'Claude Shannon', output: 'Shannon, Claude' },
      ];

      const res = synthesizeProgram(examples);
      expect(res).not.toBeNull();
      expect(res?.verified).toBe(true);
      expect(res?.program.depth).toBe(2);
      expect(res?.program.execute('Donald Knuth')).toBe('Knuth, Donald');
    });

    it('enforces 80/20 train/test verification and achieves 100% test accuracy', () => {
      const examples = [
        { input: 'usr_1', output: 'USR_1' },
        { input: 'usr_2', output: 'USR_2' },
        { input: 'usr_3', output: 'USR_3' },
        { input: 'usr_4', output: 'USR_4' },
        { input: 'usr_5', output: 'USR_5' }, // 20% test partition
      ];

      const res = synthesizeProgram(examples);
      expect(res?.verified).toBe(true);
      expect(res?.trainAccuracy).toBe(1.0);
      expect(res?.testAccuracy).toBe(1.0);
    });

    it('returns null on contradictory or unlearnable examples', () => {
      const examples = [
        { input: 'same_input', output: 'output_A' },
        { input: 'same_input', output: 'output_B' },
      ];

      const res = synthesizeProgram(examples);
      expect(res).toBeNull();
    });

    it('supports deepEquals helper correctly across nested objects and numbers', () => {
      expect(deepEquals(10.000001, 10.000002)).toBe(true);
      expect(deepEquals({ a: [1, 2] }, { a: [1, 2] })).toBe(true);
      expect(deepEquals({ a: 1 }, { a: 2 })).toBe(false);
      expect(deepEquals(null, null)).toBe(true);
      expect(deepEquals(null, undefined)).toBe(false);
    });

    it('synthesizes inductive substring slice deduction from prefix matches', () => {
      const examples = [
        { input: 'ORDER_PREFIX_101', output: 'ORDER' },
        { input: 'ORDER_PREFIX_202', output: 'ORDER' },
        { input: 'ORDER_PREFIX_303', output: 'ORDER' },
        { input: 'ORDER_PREFIX_404', output: 'ORDER' },
        { input: 'ORDER_PREFIX_505', output: 'ORDER' },
      ];

      const res = synthesizeProgram(examples);
      expect(res).not.toBeNull();
      expect(res?.verified).toBe(true);
      expect(res?.program.execute('ORDER_PREFIX_999')).toBe('ORDER');
    });

    it('executes StringTransformationDSL operations with accurate affixes and padding', () => {
      expect(StringTransformationDSL.slice('abcdef', 0, 3)).toBe('abc');
      expect(StringTransformationDSL.concat('hello', 'world', ' ')).toBe('hello world');
      expect(StringTransformationDSL.replace('order_v1', 'v1', 'v2')).toBe('order_v2');
      expect(StringTransformationDSL.pad('42', 5, '0')).toBe('00042');
      expect(StringTransformationDSL.prefix('123', 'id_')).toBe('id_123');
      expect(StringTransformationDSL.suffix('123', '_suffix')).toBe('123_suffix');
    });
  });
});

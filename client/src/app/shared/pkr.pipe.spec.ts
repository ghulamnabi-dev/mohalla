import { PkrPipe } from './pkr.pipe';

describe('PkrPipe', () => {
  const pipe = new PkrPipe();
  it('formats rupees with grouping', () => expect(pipe.transform(12500)).toBe('Rs 12,500'));
  it('handles null', () => expect(pipe.transform(null)).toBe('—'));
});

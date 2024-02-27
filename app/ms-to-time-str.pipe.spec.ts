import { MsToTimeStrPipe } from './ms-to-time-str.pipe';

describe('MsToTimeStrPipe', () => {
  it('create an instance', () => {
    const pipe = new MsToTimeStrPipe();
    expect(pipe).toBeTruthy();
  });
});

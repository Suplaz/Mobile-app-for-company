const C39: Record<string, string> = {
  '0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn','4':'nnnwwnnnw',
  '5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw','8':'wnnwnnwnn','9':'nnwwnnwnn',
  'A':'wnnnnwnnw','B':'nnwnnwnnw','C':'wnwnnwnnn','D':'nnnnwwnnw','E':'wnnnwwnnn',
  'F':'nnwnwwnnn','G':'nnnnnwwnw','H':'wnnnnwwnn','I':'nnwnnwwnn','J':'nnnnwwwnn',
  'K':'wnnnnnnww','L':'nnwnnnnww','M':'wnwnnnnwn','N':'nnnnwnnww','O':'wnnnwnnwn',
  'P':'nnwnwnnwn','Q':'nnnnnnwww','R':'wnnnnnwwn','S':'nnwnnnwwn','T':'nnnnwnwwn',
  'U':'wwnnnnnnw','V':'nwwnnnnnw','W':'wwwnnnnnn','X':'nwnnwnnnw','Y':'wwnnwnnnn',
  'Z':'nwwnwnnnn','-':'nwnnnnwnw','.':'wwnnnnwnn',' ':'nwwnnnwnn','*':'nwnnwnwnn',
};

export interface Bar { on: boolean; w: number }

export function code39bars(value: string): Bar[] {
  const text = '*' + String(value).toUpperCase().replace(/[^0-9A-Z. -]/g, '') + '*';
  const bars: Bar[] = [];
  const N = 1.6, W = 4.0;
  for (let i = 0; i < text.length; i++) {
    const pat = C39[text[i]] ?? C39[' '];
    for (let j = 0; j < 9; j++) {
      bars.push({ on: j % 2 === 0, w: pat[j] === 'w' ? W : N });
    }
    if (i < text.length - 1) bars.push({ on: false, w: N });
  }
  return bars;
}

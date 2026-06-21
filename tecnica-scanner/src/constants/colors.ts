export const C = {
  orange:       '#ED6B06',
  orangeLight:  '#FBEAD9',
  orangeText:   '#B5560A',
  blueDark:     '#004063',
  charcoal:     '#3C4042',
  slate:        '#515758',
  bgWarm:       '#EFEFEC',
  bgWhite:      '#fff',
  border:       '#E4E4DF',
  borderLight:  '#F0F0EC',
  textPrimary:  '#1c1f20',
  textSecondary:'#6B7173',
  textMuted:    '#8A9092',
  textFaint:    '#B0B5B6',
  red:          '#C42026',
  redLight:     '#FBE3E4',
  green:        '#1F7A3D',
  greenLight:   '#E6F2E9',
  blueInfo:     '#0A4D78',
  blueLight:    '#E2ECF2',
  scanBg:       '#0F1214',
  scanPanel:    '#16191B',
} as const;

export const TONES = {
  ok:        { fg: C.green,      bg: C.greenLight  },
  attention: { fg: C.orangeText, bg: C.orangeLight },
  issue:     { fg: C.red,        bg: C.redLight     },
  info:      { fg: C.blueInfo,   bg: C.blueLight    },
} as const;

export const DOCCAT = {
  drawing:     { fg: C.blueInfo,   bg: C.blueLight    },
  spec:        { fg: C.slate,      bg: '#ECECEA'       },
  quality:     { fg: C.green,      bg: C.greenLight    },
  safety:      { fg: C.red,        bg: C.redLight      },
  instruction: { fg: C.orangeText, bg: C.orangeLight   },
} as const;

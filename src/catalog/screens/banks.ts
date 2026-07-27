import { vals } from './merge'
import { circle, label, rect, strokedRect, textObj } from '../fabricHelpers'
import { wiseMark } from '../tokenIcons'
import { styleKitForInstitution } from '../../study/styleKits'
import {
  brandHeader,
  detailList,
  field,
  isCompactHeight,
  navBackTitle,
  tag,
  tagAll,
  type ScreenBuildContext,
  type ScreenContent,
} from '../screenUtils'

export function buildChaseScreen(ctx: ScreenBuildContext): ScreenContent {
  const bg = ctx.colors.background
  const ink = ctx.colors.ink
  const muted = ctx.colors.muted
  const blue = ctx.colors.accent
  const line = ctx.colors.line
  const font = ctx.device.fontFamily
  const headerBg = ctx.theme === 'dark' ? '#117ACA' : blue
  const headerInk = '#fff'
  const v = vals(
    {
      title: 'Transfer details',
      amountFiat: '-$45.00',
      status: 'Completed',
      recipient: 'Alex Rivera',
      accountOrIban: 'Chase …4521',
      date: 'Jul 26, 2026',
      fee: '$0.00',
      other: 'Zelle®',
      time: '9:41',
      battery: '100',
    },
    ctx.values,
  )
  const compact = isCompactHeight(ctx)
  const cx = ctx.width / 2
  const hdrH = compact ? 42 : 48
  const y0 = ctx.top + hdrH + (compact ? 12 : 20)
  const listY = y0 + (compact ? 108 : 128)
  const rowH = compact ? 38 : 44

  return {
    background: bg,
    palette: [bg, ink, blue, muted],
    fields: [
      field('title', 'title', 'Title', 'Transfer details'),
      field('amountFiat', 'amountFiat', 'Amount', '-$45.00'),
      field('status', 'status', 'Status', 'Completed'),
      field('recipient', 'recipient', 'To', 'Alex Rivera'),
      field('account', 'accountOrIban', 'From', 'Chase …4521'),
      field('date', 'date', 'Date', 'Jul 26, 2026'),
      field('fee', 'fee', 'Fee', '$0.00'),
      field('cta', 'other', 'Method', 'Zelle®'),
      field('time', 'time', 'Time', '9:41'),
      field('battery', 'battery', 'Battery %', '100'),
    ],
    objects: [
      ...tagAll(
        brandHeader(ctx, v.title || 'Transfer details', headerBg, headerInk, {
          height: hdrH,
          brandLeft: 'CHASE',
          font,
        }),
        'header',
      ),
      tag(
        textObj('amountFiat', v.amountFiat!, y0, cx, compact ? 30 : 36, 700, 'amountFiat', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('status', v.status!, y0 + (compact ? 40 : 48), cx, 14, 600, 'status', font, ctx.colors.success, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('cta', v.other!, y0 + (compact ? 64 : 78), cx, 13, 500, 'other', font, blue, {
          originX: 'center',
        }),
        'header',
      ),
      ...tagAll(
        detailList(
          ctx,
          listY,
          [
            {
              labelId: 'toL',
              label: 'To',
              valueId: 'recipient',
              value: v.recipient!,
              fieldKey: 'recipient',
            },
            {
              labelId: 'fromL',
              label: 'From',
              valueId: 'account',
              value: v.accountOrIban!,
              fieldKey: 'accountOrIban',
            },
            { labelId: 'dateL', label: 'Date', valueId: 'date', value: v.date!, fieldKey: 'date' },
            { labelId: 'feeL', label: 'Fee', valueId: 'fee', value: v.fee!, fieldKey: 'fee' },
          ],
          { muted, ink, font, line },
          rowH,
        ),
        'details',
      ),
    ],
  }
}

export function buildBoaScreen(ctx: ScreenBuildContext): ScreenContent {
  const bg = '#F5F5F5'
  const ink = '#012169'
  const muted = '#5C6670'
  const red = '#E31837'
  const line = '#D9DEE3'
  const font = ctx.device.fontFamily
  const v = vals(
    {
      title: 'Transfer details',
      amountFiat: '-$45.00',
      status: 'Completed',
      recipient: 'Alex Rivera',
      accountOrIban: 'Checking …8891',
      date: '07/26/2026 2:26 PM',
      fee: '$0.00',
      time: '14:26',
      battery: '87',
    },
    ctx.values,
  )
  const hdrH = 52
  const y0 = ctx.top + hdrH + 16
  const listY = y0 + 120

  return {
    background: bg,
    palette: [bg, ink, red, muted],
    fields: [
      field('title', 'title', 'Title', 'Transfer details'),
      field('amountFiat', 'amountFiat', 'Amount', '-$45.00'),
      field('status', 'status', 'Status', 'Completed'),
      field('recipient', 'recipient', 'To', 'Alex Rivera'),
      field('account', 'accountOrIban', 'From', 'Checking …8891'),
      field('date', 'date', 'Date', '07/26/2026 2:26 PM'),
      field('fee', 'fee', 'Fee', '$0.00'),
      field('time', 'time', 'Time', '14:26'),
      field('battery', 'battery', 'Battery %', '87'),
    ],
    objects: [
      ...tagAll(brandHeader(ctx, v.title || 'Transfer details', ink, '#fff', { height: hdrH, font }), 'header'),
      tag(rect('boaRed', 0, ctx.top + hdrH - 3, ctx.width, 3, red), 'header'),
      tag(rect('card', 16, y0, ctx.width - 32, 300, '#FFFFFF', 10), 'details'),
      tag(
        textObj('amountFiat', v.amountFiat!, y0 + 28, ctx.width / 2, 30, 700, 'amountFiat', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('status', v.status!, y0 + 70, ctx.width / 2, 14, 600, 'status', font, '#0D7A3E', {
          originX: 'center',
        }),
        'header',
      ),
      ...tagAll(
        detailList(
          ctx,
          listY,
          [
            {
              labelId: 'toL',
              label: 'To',
              valueId: 'recipient',
              value: v.recipient!,
              fieldKey: 'recipient',
            },
            {
              labelId: 'fromL',
              label: 'From',
              valueId: 'account',
              value: v.accountOrIban!,
              fieldKey: 'accountOrIban',
            },
            { labelId: 'dateL', label: 'Date', valueId: 'date', value: v.date!, fieldKey: 'date' },
            { labelId: 'feeL', label: 'Fee', valueId: 'fee', value: v.fee!, fieldKey: 'fee' },
          ],
          { muted, ink, font, line },
          44,
        ),
        'details',
      ),
    ],
  }
}

export function buildRevolutScreen(ctx: ScreenBuildContext): ScreenContent {
  const kit = styleKitForInstitution('revolut-payment')
  const bg = '#000000'
  const ink = '#FFFFFF'
  const muted = '#8E8E93'
  const statusMuted = '#A8A8AE'
  const card = '#1C1C1E'
  const chip = '#2C2C2E'
  const blue = '#007AFF'
  const link = '#3B82F6'
  const green = '#30D158'
  const avatarBg = '#5EC8D8'
  const teal = '#0A6B6F'
  const font =
    ctx.colors.fontFamily ||
    kit?.fontFamily ||
    'Roboto, "Google Sans", -apple-system, sans-serif'
  const v = vals({ ...REVOLUT_DEFAULTS, charging: '' }, ctx.values)
  const compact = isCompactHeight(ctx)
  const w = ctx.width
  const cx = w / 2
  const side = 16
  const cardR = 16
  const recipient = v.recipient || REVOLUT_DEFAULTS.recipient!
  const amount = v.amountFiat || REVOLUT_DEFAULTS.amountFiat!
  const relative = v.date || REVOLUT_DEFAULTS.date!
  const equivalent = v.fee || REVOLUT_DEFAULTS.fee!
  const reference = v.other || REVOLUT_DEFAULTS.other!
  const statusTitle = v.status || REVOLUT_DEFAULTS.status!
  const fromWallet = v.walletType || REVOLUT_DEFAULTS.walletType!
  const stepTime = v.network || 'Today 11:08'
  const initials = recipientInitials(recipient)

  // Compact vertical rhythm so full footer fits on S23 (780)
  const navY = ctx.top + 6
  const navR = compact ? 18 : 20
  const avatarR = compact ? 36 : 40
  const avatarTop = navY + 38
  const nameTop = avatarTop + avatarR * 2 + 12
  const amountTop = nameTop + 24
  const relativeTop = amountTop + (compact ? 38 : 42)
  const actionsTop = relativeTop + 24
  const actionH = 40
  const gap = 8
  const actionW = (w - side * 2 - gap * 2) / 3
  const equivTop = actionsTop + actionH + 14
  const equivH = 48
  const refTop = equivTop + equivH + 8
  const refH = 56
  const timelineTop = refTop + refH + 8
  // Rhythm measured from the real receipt (scaled from 460px-wide capture)
  const stepH = compact ? 52 : 59
  const timelinePadTop = compact ? 48 : 54 // card top → first step title
  const stepBarH = compact ? 44 : 49
  const bar3H = compact ? 61 : 68
  const timeOff = compact ? 21 : 24
  const note2Off = compact ? 38 : 43
  const timelineH = timelinePadTop - 8 + stepH * 2 + bar3H + (compact ? 12 : 14)
  const footerTop = timelineTop + timelineH + 8
  const footerH = 78
  const barX = side + 16
  const contentL = side + 36
  const washH = Math.max(actionsTop - 4, avatarTop + avatarR * 2 + 100)

  const objs: ReturnType<typeof tag>[] = [
    // Smooth teal → black vertical gradient — matches real Revolut header
    tag(
      {
        ...rect('tealWash', 0, 0, w, washH, teal),
        fill: {
          type: 'linear',
          coords: { x1: 0, y1: 0, x2: 0, y2: washH },
          colorStops: [
            { offset: 0, color: '#0E7377' },
            { offset: 0.35, color: '#0A5C5F' },
            { offset: 0.7, color: '#043336' },
            { offset: 1, color: '#000000' },
          ],
          gradientUnits: 'pixels',
        },
      },
      'header',
    ),

    // Dark charcoal circular nav buttons with vector glyphs (as in the real app)
    tag(circle('backBg', side, navY, navR, 'rgba(28,36,36,0.55)'), 'header'),
    ...revolutBackArrow('backArr', side + navR, navY + navR, ink),
    tag(circle('menuBg', w - side - navR * 2, navY, navR, 'rgba(28,36,36,0.55)'), 'header'),
    ...revolutMenuDots('menuDots', w - side - navR, navY + navR, ink),

    tag(circle('avatar', cx - avatarR, avatarTop, avatarR, avatarBg), 'header'),
    tag(
      textObj(
        'initials',
        initials,
        avatarTop + avatarR - (compact ? 12 : 14),
        cx,
        compact ? 24 : 26,
        600,
        null,
        font,
        '#FFFFFF',
        { originX: 'center' },
      ),
      'header',
    ),
    tag(circle('outBg', cx + avatarR - 16, avatarTop + avatarR * 2 - 18, 10, '#FFFFFF'), 'header'),
    tag(
      label('outArrow', '→', avatarTop + avatarR * 2 - 15, cx + avatarR - 13, 12, 700, font, '#111111'),
      'header',
    ),

    tag(
      textObj('recipient', recipient, nameTop, cx, 16, 600, 'recipient', font, ink, {
        originX: 'center',
      }),
      'header',
    ),
    tag(
      textObj('amountFiat', amount, amountTop, cx, compact ? 36 : 40, 700, 'amountFiat', font, ink, {
        originX: 'center',
      }),
      'header',
    ),
    tag(
      textObj('date', relative, relativeTop, cx, 13, 400, 'date', font, muted, {
        originX: 'center',
      }),
      'header',
    ),

    tag(rect('sendAgainBg', side, actionsTop, actionW, actionH, '#FFFFFF', actionH / 2), 'cta'),
    tag(label('sendAgainIcon', '→', actionsTop + 11, side + 11, 14, 700, font, '#111111'), 'cta'),
    tag(label('sendAgainLbl', 'Send again', actionsTop + 12, side + 28, 12, 600, font, '#111111'), 'cta'),

    tag(rect('scheduleBg', side + actionW + gap, actionsTop, actionW, actionH, chip, actionH / 2), 'cta'),
    ...revolutCalendarIcon('sched', side + actionW + gap + 10, actionsTop + 11, ink),
    tag(
      label('scheduleLbl', 'Schedule', actionsTop + 12, side + actionW + gap + 28, 12, 500, font, ink),
      'cta',
    ),

    tag(rect('splitBg', side + (actionW + gap) * 2, actionsTop, actionW, actionH, chip, actionH / 2), 'cta'),
    ...revolutSplitIcon('split', side + (actionW + gap) * 2 + 11, actionsTop + 11, ink),
    tag(
      label('splitLbl', 'Split bill', actionsTop + 12, side + (actionW + gap) * 2 + 28, 12, 500, font, ink),
      'cta',
    ),

    tag(rect('equivCard', side, equivTop, w - side * 2, equivH, card, cardR), 'details'),
    tag(label('equivL', 'Equivalent to', equivTop + 16, side + 14, 13, 400, font, muted), 'details'),
    ...bulgarianFlag(
      'bgFlag',
      w - side - 14 - measureApprox(equivalent, 14) - 26,
      equivTop + 16,
    ),
    tag(
      textObj('fee', equivalent, equivTop + 15, w - side - 14, 14, 600, 'fee', font, ink, {
        originX: 'right',
      }),
      'details',
    ),

    tag(rect('refCard', side, refTop, w - side * 2, refH, card, cardR), 'details'),
    tag(label('refL', 'Reference', refTop + 10, side + 14, 12, 400, font, muted), 'details'),
    tag(textObj('cta', reference, refTop + 30, side + 14, 15, 500, 'other', font, ink), 'details'),

    tag(rect('tlCard', side, timelineTop, w - side * 2, timelineH, card, cardR), 'details'),
    // Title is muted grey on real Revolut
    tag(
      textObj('status', statusTitle, timelineTop + 12, side + 14, 14, 500, 'status', font, statusMuted),
      'details',
    ),
    ...revolutShareIcon('shareIc', w - side - 14 - measureApprox('Share', 13) - 19, timelineTop + 12, link),
    tag(
      label('share', 'Share', timelineTop + 12, w - side - 14, 13, 500, font, link, {
        originX: 'right',
      }),
      'details',
    ),
  ]

  const titles = ['Verified by Revolut', "Sent to recipient's bank", "Received by recipient's bank"]
  for (let i = 0; i < 3; i++) {
    const y = timelineTop + timelinePadTop + i * stepH // step title top
    const barH = i === 2 ? bar3H : stepBarH
    // Bar spans the whole step: 8px above the title to below the last line
    objs.push(tag(rect(`s${i}Bar`, barX, y - 8, 4, barH, green, 2), 'details'))
    objs.push(tag(textObj(`s${i}T`, titles[i], y, contentL, 14, 600, null, font, ink), 'details'))
    if (i < 2) {
      objs.push(tag(label(`s${i}S`, stepTime, y + timeOff, contentL, 12, 400, font, muted), 'details'))
    } else {
      objs.push(
        tag(label(`s${i}S`, `${stepTime} ·`, y + timeOff, contentL, 12, 400, font, muted), 'details'),
      )
      const timeW = measureApprox(`${stepTime} · `, 12)
      const disc2Text = "credit the recipient's account."
      objs.push(
        tag(
          label(
            'disc1',
            compact ? 'May take extra time to' : 'It may take additional time to',
            y + timeOff,
            contentL + timeW,
            12,
            400,
            font,
            muted,
          ),
          'details',
        ),
      )
      objs.push(tag(label('disc2', disc2Text, y + note2Off, contentL, 12, 400, font, muted), 'details'))
      objs.push(
        tag(
          label(
            'learnMore',
            'Learn more',
            y + note2Off,
            contentL + measureApprox(`${disc2Text} `, 12) + 4,
            12,
            500,
            font,
            link,
          ),
          'details',
        ),
      )
    }
  }

  objs.push(
    tag(rect('footCard', side, footerTop, w - side * 2, footerH, card, cardR), 'details'),
    tag(label('fromL', 'From', footerTop + 14, side + 14, 13, 400, font, muted), 'details'),
    ...revolutRMark('revR', w - side - 14 - measureApprox(fromWallet, 13) - 24, footerTop + 12, blue),
    tag(
      textObj('walletType', fromWallet, footerTop + 13, w - side - 14, 13, 600, 'walletType', font, blue, {
        originX: 'right',
      }),
      'details',
    ),
    tag(label('confL', 'Confirmation', footerTop + 46, side + 14, 13, 400, font, muted), 'details'),
    tag(
      label('download', '↓  Download', footerTop + 45, w - side - 14, 13, 600, font, blue, {
        originX: 'right',
      }),
      'details',
    ),
  )

  return {
    background: bg,
    palette: [bg, teal, ink, blue, green, avatarBg, card],
    fields: [
      field('recipient', 'recipient', 'Recipient', REVOLUT_DEFAULTS.recipient!),
      field('amountFiat', 'amountFiat', 'Amount', REVOLUT_DEFAULTS.amountFiat!),
      field('date', 'date', 'When', REVOLUT_DEFAULTS.date!),
      field('fee', 'fee', 'Equivalent', REVOLUT_DEFAULTS.fee!),
      field('cta', 'other', 'Reference', REVOLUT_DEFAULTS.other!),
      field('status', 'status', 'Status', REVOLUT_DEFAULTS.status!),
      field('walletType', 'walletType', 'From', REVOLUT_DEFAULTS.walletType!),
      field('network', 'network', 'Step time', 'Today 11:08'),
      field('time', 'time', 'Time', REVOLUT_DEFAULTS.time!),
      field('battery', 'battery', 'Battery %', REVOLUT_DEFAULTS.battery!),
    ],
    objects: objs,
  }
}

function measureApprox(text: string, fontSize: number): number {
  let units = 0
  for (const ch of text) {
    if (" .·:'iljt1I".includes(ch)) units += 0.3
    else if ('fr-()'.includes(ch)) units += 0.37
    else if ('mwMW'.includes(ch)) units += 0.85
    else if (ch >= 'A' && ch <= 'Z') units += 0.64
    else units += 0.52
  }
  return Math.ceil(units * fontSize)
}

/** Circular Bulgarian flag (Revolut uses round flag badges). */
function bulgarianFlag(prefix: string, left: number, top: number) {
  const d = 15
  const band = d / 3
  const colors = ['#FFFFFF', '#00966E', '#D62612']
  return colors.map((c, i) =>
    tag(
      {
        ...rect(`${prefix}${i}`, left, top + band * i, d, band, c, 0),
        clipPath: {
          type: 'Circle',
          version: '7.0.0',
          radius: d / 2,
          originX: 'center',
          originY: 'center',
          left: 0,
          // circle center relative to this stripe's center
          top: band * (1 - i),
        },
      },
      'details',
    ),
  )
}

/** Back arrow drawn from shapes — text glyphs render inconsistently. */
function revolutBackArrow(prefix: string, cx: number, cy: number, ink: string) {
  const half = 6.5
  const chevron = (name: string, angle: number) =>
    tag(
      {
        ...rect(name, cx - half, cy, 7.5, 2.2, ink, 1.1, {
          originX: 'left',
          originY: 'center',
        }),
        angle,
      },
      'header',
    )
  return [
    tag(
      rect(`${prefix}Shaft`, cx - half, cy - 1.1, half * 2, 2.2, ink, 1.1),
      'header',
    ),
    chevron(`${prefix}Up`, -45),
    chevron(`${prefix}Dn`, 45),
  ]
}

function revolutMenuDots(prefix: string, cx: number, cy: number, ink: string) {
  const r = 1.8
  const gapX = 5.4
  return [-1, 0, 1].map((i) =>
    tag(circle(`${prefix}${i + 1}`, cx + i * gapX - r, cy - r, r, ink), 'header'),
  )
}

function revolutRMark(prefix: string, left: number, top: number, color: string) {
  return [
    tag(label(`${prefix}T`, 'R', top, left, 14, 800, 'Roboto, sans-serif', color), 'details'),
  ]
}

function revolutShareIcon(prefix: string, left: number, top: number, color: string) {
  return [
    tag(strokedRect(`${prefix}Box`, left, top + 4, 10, 9, color, 1.5, 1.2), 'details'),
    tag(label(`${prefix}Arr`, '↑', top - 1, left + 1, 11, 700, 'sans-serif', color), 'details'),
  ]
}

function revolutCalendarIcon(prefix: string, left: number, top: number, ink: string) {
  return [
    tag(strokedRect(`${prefix}Cal`, left, top + 2, 12, 11, ink, 2, 1.25), 'cta'),
    tag(rect(`${prefix}CalTop`, left + 2, top, 2, 4, ink, 1), 'cta'),
    tag(rect(`${prefix}CalTop2`, left + 8, top, 2, 4, ink, 1), 'cta'),
    tag(rect(`${prefix}CalLine`, left + 2, top + 6, 8, 1, ink, 0.5), 'cta'),
  ]
}

function revolutSplitIcon(prefix: string, left: number, top: number, ink: string) {
  return [
    tag(rect(`${prefix}Stem`, left + 5, top + 6, 2, 8, ink, 1), 'cta'),
    tag(rect(`${prefix}L`, left, top + 2, 6, 2, ink, 1), 'cta'),
    tag(rect(`${prefix}R`, left + 6, top + 2, 6, 2, ink, 1), 'cta'),
    tag(rect(`${prefix}LL`, left, top, 2, 4, ink, 1), 'cta'),
    tag(rect(`${prefix}RR`, left + 10, top, 2, 4, ink, 1), 'cta'),
  ]
}

/** Revolut transfer-completed defaults (matches provided screenshot). */
export const REVOLUT_DEFAULTS = {
  title: 'Transfer completed',
  recipient: 'Ricardo Moreno Ruiz',
  amountFiat: '-€90',
  date: 'Moments ago',
  fee: 'лв 176.03',
  other: 'Sent from Revolut',
  status: 'Transfer completed',
  walletType: 'Personal · EUR',
  network: 'Today 11:08',
  time: '11:08',
  battery: '35',
  charging: '',
  cellular: 'off',
} as const

/** Revolut-style initials: first+middle when 3+ names (Ricardo Moreno Ruiz → RM). */
function recipientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  if (parts.length >= 3) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function buildWiseScreen(ctx: ScreenBuildContext): ScreenContent {
  const bg = ctx.colors.background
  const ink = ctx.colors.ink
  const muted = ctx.colors.muted
  const green = ctx.colors.accent
  const darkGreen = ctx.theme === 'dark' ? '#9FE870' : '#163300'
  const line = ctx.colors.line
  const font = ctx.device.fontFamily
  const v = vals(
    {
      title: 'Money sent',
      amountFiat: '45.00 USD',
      status: 'Sent',
      recipient: 'Alex Rivera',
      accountOrIban: 'DE89 3704 0044 0532 0130 00',
      date: '26 Jul 2026',
      fee: '0.74 USD',
      other: 'Should arrive by Jul 27',
      time: '9:41',
      battery: '100',
    },
    ctx.values,
  )
  const cx = ctx.width / 2
  const y0 = ctx.top + 40
  const listY = y0 + 150

  return {
    background: bg,
    palette: [bg, ink, green, darkGreen],
    fields: [
      field('title', 'title', 'Title', 'Money sent'),
      field('amountFiat', 'amountFiat', 'Amount', '45.00 USD'),
      field('status', 'status', 'Status', 'Sent'),
      field('recipient', 'recipient', 'To', 'Alex Rivera'),
      field('account', 'accountOrIban', 'Account', 'DE89 3704 0044 0532 0130 00'),
      field('date', 'date', 'Date', '26 Jul 2026'),
      field('fee', 'fee', 'Fee', '0.74 USD'),
      field('cta', 'other', 'ETA', 'Should arrive by Jul 27'),
      field('time', 'time', 'Time', '9:41'),
      field('battery', 'battery', 'Battery %', '100'),
    ],
    objects: [
      ...tagAll(navBackTitle(ctx, v.title || 'Money sent', { ink, font }), 'header'),
      ...wiseMark('wise', cx, y0 - 2, 16),
      tag(rect('badge', cx - 42, y0 + 38, 84, 28, green, 14), 'header'),
      tag(
        textObj('status', v.status!, y0 + 44, cx, 13, 700, 'status', font, darkGreen, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('amountFiat', v.amountFiat!, y0 + 78, cx, 30, 700, 'amountFiat', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('cta', v.other!, y0 + 116, cx, 13, 400, 'other', font, muted, {
          originX: 'center',
        }),
        'header',
      ),
      ...tagAll(
        detailList(
          ctx,
          listY,
          [
            {
              labelId: 'toL',
              label: 'To',
              valueId: 'recipient',
              value: v.recipient!,
              fieldKey: 'recipient',
            },
            {
              labelId: 'accL',
              label: 'Account',
              valueId: 'account',
              value: v.accountOrIban!,
              fieldKey: 'accountOrIban',
              mono: true,
            },
            { labelId: 'feeL', label: 'Fee', valueId: 'fee', value: v.fee!, fieldKey: 'fee' },
            { labelId: 'dateL', label: 'Date', valueId: 'date', value: v.date!, fieldKey: 'date' },
          ],
          { muted, ink, font, line },
          44,
        ),
        'details',
      ),
    ],
  }
}

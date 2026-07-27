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
  const card = '#1C1C1E'
  const chip = '#2C2C2E'
  const blue = '#0666EB'
  const link = '#3B82F6'
  const green = '#2ACF6F'
  const avatarBg = '#7EC8D9'
  const tealTop = '#0B6B6F'
  const tealMid = '#064A4D'
  const font =
    ctx.colors.fontFamily ||
    kit?.fontFamily ||
    '-apple-system, "SF Pro Text", "Helvetica Neue", Inter, sans-serif'
  const v = vals(REVOLUT_DEFAULTS, ctx.values)
  const compact = isCompactHeight(ctx)
  const w = ctx.width
  const cx = w / 2
  const side = 16
  const cardR = 20
  const recipient = v.recipient || REVOLUT_DEFAULTS.recipient!
  const amount = v.amountFiat || REVOLUT_DEFAULTS.amountFiat!
  const relative = v.date || REVOLUT_DEFAULTS.date!
  const equivalent = v.fee || REVOLUT_DEFAULTS.fee!
  const reference = v.other || REVOLUT_DEFAULTS.other!
  const statusTitle = v.status || REVOLUT_DEFAULTS.status!
  const fromWallet = v.walletType || REVOLUT_DEFAULTS.walletType!
  const stepTime = v.network || 'Today 11:08'
  const initials = recipientInitials(recipient)

  const navY = ctx.top + 10
  const avatarR = compact ? 38 : 44
  const avatarTop = navY + 40
  const nameTop = avatarTop + avatarR * 2 + 14
  const amountTop = nameTop + 28
  const relativeTop = amountTop + (compact ? 40 : 46)
  const actionsTop = relativeTop + 30
  const actionH = 44
  const gap = 8
  const actionW = (w - side * 2 - gap * 2) / 3
  const equivTop = actionsTop + actionH + 16
  const equivH = 52
  const refTop = equivTop + equivH + 8
  const refH = 62
  const timelineTop = refTop + refH + 8
  const stepH = compact ? 48 : 52
  const timelinePadTop = 44
  const disclaimerExtra = compact ? 28 : 34
  const timelineH = timelinePadTop + stepH * 3 + disclaimerExtra
  const footerTop = timelineTop + timelineH + 8
  const footerH = 88
  const barX = side + 18

  const objs: ReturnType<typeof tag>[] = [
    tag(rect('tealDeep', 0, 0, w, avatarTop + avatarR + 80, tealTop), 'header'),
    tag({ ...rect('tealFade', 0, avatarTop + 20, w, 160, tealMid), opacity: 0.85 }, 'header'),
    tag({ ...rect('blackA', 0, nameTop - 10, w, 70, bg), opacity: 0.25 }, 'header'),
    tag({ ...rect('blackB', 0, amountTop - 4, w, 90, bg), opacity: 0.55 }, 'header'),
    tag({ ...rect('blackC', 0, relativeTop - 4, w, 80, bg), opacity: 0.88 }, 'header'),
    tag(rect('blackRest', 0, actionsTop - 8, w, Math.max(120, ctx.height - (actionsTop - 8)), bg), 'header'),

    tag(label('back', '←', navY, side + 2, 22, 400, font, ink), 'header'),
    tag(label('menu', '•••', navY + 2, w - side - 28, 16, 700, font, ink), 'header'),

    tag(circle('avatar', cx - avatarR, avatarTop, avatarR, avatarBg), 'header'),
    tag(
      textObj(
        'initials',
        initials,
        avatarTop + avatarR - (compact ? 13 : 15),
        cx,
        compact ? 24 : 28,
        600,
        null,
        font,
        '#FFFFFF',
        { originX: 'center' },
      ),
      'header',
    ),
    tag(circle('outBg', cx + avatarR - 17, avatarTop + avatarR * 2 - 19, 11, '#FFFFFF'), 'header'),
    tag(
      label('outArrow', '→', avatarTop + avatarR * 2 - 16, cx + avatarR - 13, 13, 700, font, '#111111'),
      'header',
    ),

    tag(
      textObj('recipient', recipient, nameTop, cx, 17, 600, 'recipient', font, ink, {
        originX: 'center',
      }),
      'header',
    ),
    tag(
      textObj('amountFiat', amount, amountTop, cx, compact ? 36 : 42, 700, 'amountFiat', font, ink, {
        originX: 'center',
      }),
      'header',
    ),
    tag(
      textObj('date', relative, relativeTop, cx, 14, 400, 'date', font, muted, {
        originX: 'center',
      }),
      'header',
    ),

    tag(rect('sendAgainBg', side, actionsTop, actionW, actionH, '#FFFFFF', actionH / 2), 'cta'),
    tag(circle('sendAgainIconBg', side + 10, actionsTop + 12, 10, '#111111'), 'cta'),
    tag(label('sendAgainIcon', '→', actionsTop + 14, side + 13, 12, 700, font, '#FFFFFF'), 'cta'),
    tag(label('sendAgainLbl', 'Send again', actionsTop + 14, side + 34, 12, 600, font, '#111111'), 'cta'),

    tag(rect('scheduleBg', side + actionW + gap, actionsTop, actionW, actionH, chip, actionH / 2), 'cta'),
    ...revolutCalendarIcon('sched', side + actionW + gap + 12, actionsTop + 13, ink),
    tag(
      label('scheduleLbl', 'Schedule', actionsTop + 14, side + actionW + gap + 32, 12, 500, font, ink),
      'cta',
    ),

    tag(rect('splitBg', side + (actionW + gap) * 2, actionsTop, actionW, actionH, chip, actionH / 2), 'cta'),
    ...revolutSplitIcon('split', side + (actionW + gap) * 2 + 12, actionsTop + 14, ink),
    tag(
      label('splitLbl', 'Split bill', actionsTop + 14, side + (actionW + gap) * 2 + 32, 12, 500, font, ink),
      'cta',
    ),

    tag(rect('equivCard', side, equivTop, w - side * 2, equivH, card, cardR), 'details'),
    tag(label('equivL', 'Equivalent to', equivTop + 18, side + 16, 14, 400, font, muted), 'details'),
    ...bulgarianFlag('bgFlag', w - side - 16 - 14 - measureApprox(equivalent, 14) - 8, equivTop + 19),
    tag(
      textObj('fee', equivalent, equivTop + 17, w - side - 16, 14, 600, 'fee', font, ink, {
        originX: 'right',
      }),
      'details',
    ),

    tag(rect('refCard', side, refTop, w - side * 2, refH, card, cardR), 'details'),
    tag(label('refL', 'Reference', refTop + 12, side + 16, 13, 400, font, muted), 'details'),
    tag(
      textObj('cta', reference, refTop + 32, side + 16, 15, 500, 'other', font, ink),
      'details',
    ),

    tag(rect('tlCard', side, timelineTop, w - side * 2, timelineH, card, cardR), 'details'),
    tag(
      textObj('status', statusTitle, timelineTop + 14, side + 16, 15, 600, 'status', font, ink),
      'details',
    ),
    tag(
      label('share', '↗  Share', timelineTop + 14, w - side - 16, 13, 500, font, link, {
        originX: 'right',
      }),
      'details',
    ),
  ]

  const titles = ['Verified by Revolut', "Sent to recipient's bank", "Received by recipient's bank"]
  for (let i = 0; i < 3; i++) {
    const y = timelineTop + timelinePadTop + i * stepH
    const barH = i === 2 ? 18 : 28
    objs.push(tag(rect(`s${i}Bar`, barX, y + 2, 4, barH, green, 2), 'details'))
    objs.push(tag(textObj(`s${i}T`, titles[i], y, side + 36, 14, 600, null, font, ink), 'details'))
    if (i < 2) {
      objs.push(tag(label(`s${i}S`, stepTime, y + 20, side + 36, 12, 400, font, muted), 'details'))
    } else {
      objs.push(tag(label(`s${i}S`, `${stepTime} ·`, y + 20, side + 36, 12, 400, font, muted), 'details'))
      const timeW = measureApprox(`${stepTime} · `, 12)
      objs.push(
        tag(
          label(
            'disclaimer',
            compact
              ? 'May take extra time to credit.'
              : "It may take additional time to credit the recipient's account.",
            y + 20,
            side + 36 + timeW,
            12,
            400,
            font,
            muted,
          ),
          'details',
        ),
      )
      objs.push(tag(label('learnMore', 'Learn more', y + 38, side + 36, 12, 500, font, link), 'details'))
    }
  }

  objs.push(
    tag(rect('footCard', side, footerTop, w - side * 2, footerH, card, cardR), 'details'),
    tag(label('fromL', 'From', footerTop + 18, side + 16, 14, 400, font, muted), 'details'),
    ...revolutRMark('revR', w - side - 16 - measureApprox(fromWallet, 14) - 22, footerTop + 16),
    tag(
      textObj('walletType', fromWallet, footerTop + 17, w - side - 16, 14, 600, 'walletType', font, blue, {
        originX: 'right',
      }),
      'details',
    ),
    tag(label('confL', 'Confirmation', footerTop + 52, side + 16, 14, 400, font, muted), 'details'),
    tag(
      label('download', '↓  Download', footerTop + 51, w - side - 16, 14, 600, font, blue, {
        originX: 'right',
      }),
      'details',
    ),
  )

  return {
    background: bg,
    palette: [bg, tealTop, ink, blue, green, avatarBg, card],
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
  return Math.ceil(text.length * fontSize * 0.52)
}

function bulgarianFlag(prefix: string, left: number, top: number) {
  const fw = 14
  const fh = 10
  return [
    tag(rect(`${prefix}W`, left, top, fw, fh / 3, '#FFFFFF', 0), 'details'),
    tag(rect(`${prefix}G`, left, top + fh / 3, fw, fh / 3, '#00966E', 0), 'details'),
    tag(rect(`${prefix}R`, left, top + (fh * 2) / 3, fw, fh / 3, '#D62612', 0), 'details'),
  ]
}

function revolutRMark(prefix: string, left: number, top: number) {
  return [
    tag(circle(`${prefix}Bg`, left, top, 9, '#0666EB'), 'details'),
    tag(
      label(`${prefix}T`, 'R', top + 2, left + 9, 11, 700, 'Inter, sans-serif', '#FFFFFF', {
        originX: 'center',
      }),
      'details',
    ),
  ]
}

function revolutCalendarIcon(prefix: string, left: number, top: number, ink: string) {
  return [
    tag(strokedRect(`${prefix}Cal`, left, top + 2, 12, 11, ink, 2, 1.2), 'cta'),
    tag(rect(`${prefix}CalTop`, left + 2, top, 2, 4, ink, 1), 'cta'),
    tag(rect(`${prefix}CalTop2`, left + 8, top, 2, 4, ink, 1), 'cta'),
  ]
}

function revolutSplitIcon(prefix: string, left: number, top: number, ink: string) {
  return [
    tag(rect(`${prefix}a`, left, top, 5, 5, ink, 1), 'cta'),
    tag(rect(`${prefix}b`, left + 7, top, 5, 5, ink, 1), 'cta'),
    tag(rect(`${prefix}c`, left, top + 7, 5, 5, ink, 1), 'cta'),
    tag(rect(`${prefix}d`, left + 7, top + 7, 5, 5, ink, 1), 'cta'),
  ]
}

/** Revolut transfer-completed defaults (bank transfer detail). */
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
  battery: '87',
} as const

function recipientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
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

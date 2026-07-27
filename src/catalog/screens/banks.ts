import { vals } from './merge'
import { circle, label, rect, textObj } from '../fabricHelpers'
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
  const cardSoft = '#2C2C2E'
  const blue = '#0666EB'
  const link = '#3B82F6'
  const green = '#24C38E'
  const avatarBg = '#7DD3E8'
  const teal = '#0A7A7E'
  const font =
    ctx.colors.fontFamily ||
    kit?.fontFamily ||
    '-apple-system, "SF Pro Text", "Helvetica Neue", Inter, sans-serif'
  const v = vals(REVOLUT_DEFAULTS, ctx.values)
  const compact = isCompactHeight(ctx)
  const w = ctx.width
  const cx = w / 2
  const side = compact ? 14 : 16
  const cardR = compact ? 14 : 16
  const recipient = v.recipient || REVOLUT_DEFAULTS.recipient!
  const amount = v.amountFiat || REVOLUT_DEFAULTS.amountFiat!
  const relative = v.date || REVOLUT_DEFAULTS.date!
  const equivalent = v.fee || REVOLUT_DEFAULTS.fee!
  const reference = v.other || REVOLUT_DEFAULTS.other!
  const statusTitle = v.status || REVOLUT_DEFAULTS.status!
  const fromWallet = v.walletType || REVOLUT_DEFAULTS.walletType!
  const stepTime = v.network || 'Today 11:08'
  const initials = recipientInitials(recipient)

  const navY = ctx.top + (compact ? 6 : 8)
  const avatarR = compact ? 36 : 42
  const avatarTop = navY + (compact ? 36 : 44)
  const nameTop = avatarTop + avatarR * 2 + (compact ? 12 : 16)
  const amountTop = nameTop + (compact ? 26 : 30)
  const relativeTop = amountTop + (compact ? 36 : 44)
  const actionsTop = relativeTop + (compact ? 28 : 34)
  const actionH = compact ? 36 : 40
  const gap = 8
  const actionW = (w - side * 2 - gap * 2) / 3
  const equivTop = actionsTop + actionH + (compact ? 14 : 18)
  const equivH = compact ? 44 : 48
  const refTop = equivTop + equivH + 10
  const refH = compact ? 52 : 56
  const timelineTop = refTop + refH + 10
  const stepH = compact ? 44 : 50
  const timelineH = compact ? 28 + stepH * 3 + 36 : 32 + stepH * 3 + 44
  const footerTop = timelineTop + timelineH + 10
  const footerH = compact ? 72 : 80

  const actionBtn = (
    id: string,
    labelText: string,
    icon: string,
    x: number,
    fill: string,
    textFill: string,
  ): ReturnType<typeof tag>[] => [
    tag(rect(`${id}Bg`, x, actionsTop, actionW, actionH, fill, actionH / 2), 'cta'),
    tag(
      label(`${id}Icon`, icon, actionsTop + (compact ? 9 : 10), x + 10, compact ? 13 : 14, 500, font, textFill),
      'cta',
    ),
    tag(
      label(
        `${id}Lbl`,
        labelText,
        actionsTop + (compact ? 11 : 12),
        x + 28,
        compact ? 11 : 12,
        500,
        font,
        textFill,
      ),
      'cta',
    ),
  ]

  const timelineStep = (id: string, title: string, sub: string, y: number, last = false) => {
    const barH = last ? (compact ? 28 : 34) : stepH - 8
    return [
      tag(rect(`${id}Bar`, side + 14, y + 4, 3, barH, green, 1.5), 'details'),
      tag(textObj(`${id}T`, title, y, side + 28, compact ? 13 : 14, 600, null, font, ink), 'details'),
      tag(label(`${id}S`, sub, y + (compact ? 18 : 20), side + 28, compact ? 11 : 12, 400, font, muted), 'details'),
    ]
  }

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
    objects: [
      // Teal → black wash (Revolut transfer header)
      tag({ ...rect('tealWash', 0, 0, w, avatarTop + avatarR * 2 + 120, teal), opacity: 0.95 }, 'header'),
      tag({ ...rect('fadeA', 0, avatarTop + avatarR, w, 90, bg), opacity: 0.35 }, 'header'),
      tag({ ...rect('fadeB', 0, amountTop - 8, w, 110, bg), opacity: 0.72 }, 'header'),
      tag({ ...rect('fadeC', 0, actionsTop - 20, w, 60, bg), opacity: 0.92 }, 'header'),

      tag(label('back', '‹', navY - 2, side, 28, 300, font, ink), 'header'),
      tag(label('menu', '···', navY + 4, w - side - 22, 18, 700, font, ink), 'header'),

      tag(circle('avatar', cx - avatarR, avatarTop, avatarR, avatarBg), 'header'),
      tag(
        textObj('initials', initials, avatarTop + avatarR - (compact ? 12 : 14), cx, compact ? 22 : 26, 600, null, font, '#FFFFFF', {
          originX: 'center',
        }),
        'header',
      ),
      // Outbound badge on avatar
      tag(circle('outBg', cx + avatarR - 16, avatarTop + avatarR * 2 - 18, 10, '#FFFFFF'), 'header'),
      tag(
        label('outArrow', '→', avatarTop + avatarR * 2 - 16, cx + avatarR - 13, 12, 700, font, '#111'),
        'header',
      ),

      tag(
        textObj('recipient', recipient, nameTop, cx, compact ? 16 : 17, 600, 'recipient', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('amountFiat', amount, amountTop, cx, compact ? 34 : 40, 700, 'amountFiat', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('date', relative, relativeTop, cx, compact ? 13 : 14, 400, 'date', font, muted, {
          originX: 'center',
        }),
        'header',
      ),

      ...actionBtn('sendAgain', 'Send again', '→', side, '#FFFFFF', '#111111'),
      ...actionBtn('schedule', 'Schedule', '▦', side + actionW + gap, cardSoft, ink),
      ...actionBtn('split', 'Split bill', '▣', side + (actionW + gap) * 2, cardSoft, ink),

      // Equivalent card
      tag(rect('equivCard', side, equivTop, w - side * 2, equivH, card, cardR), 'details'),
      tag(label('equivL', 'Equivalent to', equivTop + (compact ? 14 : 16), side + 14, 13, 400, font, muted), 'details'),
      tag(
        textObj(
          'fee',
          `🇧🇬  ${equivalent}`,
          equivTop + (compact ? 13 : 15),
          w - side - 14,
          compact ? 13 : 14,
          600,
          'fee',
          font,
          ink,
          { originX: 'right' },
        ),
        'details',
      ),

      // Reference card
      tag(rect('refCard', side, refTop, w - side * 2, refH, card, cardR), 'details'),
      tag(label('refL', 'Reference', refTop + 10, side + 14, 12, 400, font, muted), 'details'),
      tag(
        textObj('cta', reference, refTop + (compact ? 28 : 30), side + 14, compact ? 14 : 15, 500, 'other', font, ink),
        'details',
      ),

      // Transfer completed + timeline
      tag(rect('tlCard', side, timelineTop, w - side * 2, timelineH, card, cardR), 'details'),
      tag(
        textObj(
          'status',
          statusTitle,
          timelineTop + 12,
          side + 14,
          compact ? 14 : 15,
          600,
          'status',
          font,
          ink,
        ),
        'details',
      ),
      tag(label('share', '↗  Share', timelineTop + 12, w - side - 14, 13, 500, font, link, { originX: 'right' }), 'details'),

      ...timelineStep('s1', 'Verified by Revolut', stepTime, timelineTop + 40),
      ...timelineStep('s2', "Sent to recipient's bank", stepTime, timelineTop + 40 + stepH),
      ...timelineStep(
        's3',
        "Received by recipient's bank",
        `${stepTime}`,
        timelineTop + 40 + stepH * 2,
        true,
      ),
      tag(
        label(
          'disclaimer',
          compact
            ? 'May take extra time to credit · Learn more'
            : "It may take additional time to credit the recipient's account. Learn more",
          timelineTop + 40 + stepH * 2 + (compact ? 34 : 38),
          side + 28,
          compact ? 10 : 11,
          400,
          font,
          muted,
        ),
        'details',
      ),

      // From / Confirmation footer
      tag(rect('footCard', side, footerTop, w - side * 2, footerH, card, cardR), 'details'),
      tag(label('fromL', 'From', footerTop + 14, side + 14, 13, 400, font, muted), 'details'),
      tag(
        textObj(
          'walletType',
          `Ⓡ  ${fromWallet}`,
          footerTop + 13,
          w - side - 14,
          compact ? 13 : 14,
          600,
          'walletType',
          font,
          blue,
          { originX: 'right' },
        ),
        'details',
      ),
      tag(label('confL', 'Confirmation', footerTop + (compact ? 42 : 46), side + 14, 13, 400, font, muted), 'details'),
      tag(
        label(
          'download',
          '↓  Download',
          footerTop + (compact ? 41 : 45),
          w - side - 14,
          compact ? 13 : 14,
          600,
          font,
          blue,
          { originX: 'right' },
        ),
        'details',
      ),
    ],
  }
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

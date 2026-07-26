import { vals } from './merge'
import { circle, label, rect, textObj } from '../fabricHelpers'
import { paypalMark } from '../tokenIcons'
import {
  detailList,
  field,
  isCompactHeight,
  navBackOnly,
  navBackTitle,
  successCheck,
  tag,
  tagAll,
  type ScreenBuildContext,
  type ScreenContent,
} from '../screenUtils'
import { styleKitForInstitution } from '../../study/styleKits'

export function buildPayPalScreen(ctx: ScreenBuildContext): ScreenContent {
  const kit = styleKitForInstitution('paypal-sent')
  const bg = ctx.colors.background
  const ink = ctx.colors.ink
  const muted = ctx.colors.muted
  const blue = ctx.colors.accent
  const green = ctx.colors.success
  const line = ctx.colors.line
  const font = ctx.colors.fontFamily || kit?.fontFamily || '-apple-system, "SF Pro Text", "Helvetica Neue", sans-serif'
  const v = vals(
    {
      title: 'You sent',
      amountFiat: '-$45.00',
      status: 'Completed',
      recipient: 'alex@email.com',
      date: 'Jul 26, 2026',
      fee: '$0.00',
      walletType: 'PayPal balance',
      other: 'Send more money',
      time: '9:41',
      battery: '100',
    },
    ctx.values,
  )
  const compact = isCompactHeight(ctx)
  const cx = ctx.width / 2
  const y0 = ctx.top + (compact ? 28 : (kit?.layout?.topInset ?? 36))
  const listY = y0 + (compact ? 128 : 148)
  const rowH = compact ? 38 : 44

  return {
    background: bg,
    palette: ctx.colors.palette.length ? ctx.colors.palette : kit?.palette || [bg, ink, blue, muted],
    fields: [
      field('title', 'title', 'Title', 'You sent'),
      field('amountFiat', 'amountFiat', 'Amount', '-$45.00'),
      field('status', 'status', 'Status', 'Completed'),
      field('recipient', 'recipient', 'To', 'alex@email.com'),
      field('date', 'date', 'Date', 'Jul 26, 2026'),
      field('fee', 'fee', 'Fee', '$0.00'),
      field('walletType', 'walletType', 'From', 'PayPal balance'),
      field('time', 'time', 'Time', '9:41'),
      field('battery', 'battery', 'Battery %', '100'),
    ],
    objects: [
      ...tagAll(navBackOnly(ctx, { ink, font }), 'header'),
      ...paypalMark('pp', cx, y0 - 4, compact ? 26 : 32),
      tag(
        textObj('title', v.title!, y0 + (compact ? 36 : 42), cx, 14, 400, 'title', font, muted, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj(
          'amountFiat',
          v.amountFiat!,
          y0 + (compact ? 56 : 66),
          cx,
          compact ? 30 : 36,
          700,
          'amountFiat',
          font,
          ink,
          { originX: 'center' },
        ),
        'header',
      ),
      tag(
        textObj('status', v.status!, y0 + (compact ? 96 : 112), cx, 14, 500, 'status', font, green, {
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
              valueId: 'walletType',
              value: v.walletType!,
              fieldKey: 'walletType',
            },
            { labelId: 'dateL', label: 'Date', valueId: 'date', value: v.date!, fieldKey: 'date' },
            { labelId: 'feeL', label: 'Fee', valueId: 'fee', value: v.fee!, fieldKey: 'fee' },
          ],
          { muted, ink, font, line },
          rowH,
        ),
        'details',
      ),
      tag(rect('ctaBg', 24, listY + 4 * rowH + 20, ctx.width - 48, 50, blue, 25), 'cta'),
      tag(
        textObj(
          'cta',
          v.other || 'Send more money',
          listY + 4 * rowH + 34,
          cx,
          15,
          600,
          'other',
          font,
          '#fff',
          { originX: 'center' },
        ),
        'cta',
      ),
    ],
  }
}

export function buildCashAppScreen(ctx: ScreenBuildContext): ScreenContent {
  const kit = styleKitForInstitution('cashapp-payment')
  const bg = ctx.colors.background
  const ink = ctx.colors.ink
  const dark = ctx.colors.accent
  const font = ctx.colors.fontFamily || kit?.fontFamily || '-apple-system, "SF Pro Display", "Helvetica Neue", sans-serif'
  const v = vals(
    {
      title: 'Payment',
      amountFiat: '$45',
      recipient: 'Alex',
      status: 'Complete',
      date: 'Today at 2:26 PM',
      other: 'Receipt',
      time: '14:26',
      battery: '87',
    },
    ctx.values,
  )
  const compact = isCompactHeight(ctx)
  const cx = ctx.width / 2
  const y0 = ctx.top + (compact ? 72 : (kit?.layout?.topInset ?? 110))
  const amountSize = compact ? 56 : 78

  return {
    background: bg,
    palette: ctx.colors.palette.length ? ctx.colors.palette : kit?.palette || [bg, ink, dark],
    fields: [
      field('amountFiat', 'amountFiat', 'Amount', '$45'),
      field('recipient', 'recipient', 'To', 'Alex'),
      field('status', 'status', 'Status', 'Complete'),
      field('date', 'date', 'Date', 'Today at 2:26 PM'),
      field('time', 'time', 'Time', '14:26'),
      field('battery', 'battery', 'Battery %', '87'),
    ],
    objects: [
      tag(label('back', '×', ctx.top + 8, 16, 32, 300, font, ink), 'header'),
      tag(
        textObj('amountFiat', v.amountFiat!, y0, cx, amountSize, 700, 'amountFiat', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj(
          'recipient',
          `For ${v.recipient}`,
          y0 + (compact ? 72 : 96),
          cx,
          compact ? 16 : 18,
          500,
          'recipient',
          font,
          ink,
          { originX: 'center' },
        ),
        'header',
      ),
      tag(
        textObj('status', v.status!, y0 + (compact ? 100 : 132), cx, 15, 500, 'status', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj(
          'date',
          v.date!,
          y0 + (compact ? 126 : 162),
          cx,
          13,
          400,
          'date',
          font,
          'rgba(255,255,255,0.82)',
          { originX: 'center' },
        ),
        'details',
      ),
      tag(rect('pill', cx - 68, y0 + (compact ? 200 : 250), 136, 48, dark, 24), 'cta'),
      tag(
        textObj(
          'cta',
          v.other || 'Receipt',
          y0 + (compact ? 214 : 264),
          cx,
          16,
          600,
          'other',
          font,
          ink,
          { originX: 'center' },
        ),
        'cta',
      ),
    ],
  }
}

export function buildVenmoScreen(ctx: ScreenBuildContext): ScreenContent {
  const bg = ctx.colors.background
  const ink = ctx.colors.ink
  const muted = ctx.colors.muted
  const blue = ctx.colors.accent !== '#F0B90B' ? ctx.colors.accent : '#008CFF'
  const line = ctx.colors.line
  const font = ctx.device.fontFamily
  const v = vals(
    {
      title: 'Payment',
      amountFiat: '-$45.00',
      recipient: '@alex',
      status: 'Complete',
      date: 'Jul 26, 2026',
      other: 'Coffee',
      walletType: 'Venmo balance',
      time: '9:41',
      battery: '100',
    },
    ctx.values,
  )
  const cx = ctx.width / 2
  const y0 = ctx.top + 48
  const listY = y0 + 200

  return {
    background: bg,
    palette: [bg, ink, blue, muted],
    fields: [
      field('amountFiat', 'amountFiat', 'Amount', '-$45.00'),
      field('recipient', 'recipient', 'To', '@alex'),
      field('other', 'other', 'Note', 'Coffee'),
      field('status', 'status', 'Status', 'Complete'),
      field('date', 'date', 'Date', 'Jul 26, 2026'),
      field('walletType', 'walletType', 'From', 'Venmo balance'),
      field('time', 'time', 'Time', '9:41'),
      field('battery', 'battery', 'Battery %', '100'),
    ],
    objects: [
      ...tagAll(navBackTitle(ctx, 'Payment', { ink, font }, 'title'), 'header'),
      tag(circle('avatar', cx - 30, y0, 30, blue), 'header'),
      tag(label('av', 'A', y0 + 12, cx, 24, 700, font, '#fff', { originX: 'center' }), 'header'),
      tag(
        textObj('recipient', v.recipient!, y0 + 74, cx, 16, 600, 'recipient', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('amountFiat', v.amountFiat!, y0 + 102, cx, 34, 700, 'amountFiat', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('cta', v.other || 'Coffee', y0 + 146, cx, 14, 400, 'other', font, muted, {
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
              labelId: 'stL',
              label: 'Status',
              valueId: 'status',
              value: v.status!,
              fieldKey: 'status',
              accent: '#0D7A3E',
            },
            { labelId: 'dateL', label: 'Date', valueId: 'date', value: v.date!, fieldKey: 'date' },
            {
              labelId: 'fromL',
              label: 'Paid with',
              valueId: 'walletType',
              value: v.walletType!,
              fieldKey: 'walletType',
            },
          ],
          { muted, ink, font, line },
          44,
        ),
        'details',
      ),
    ],
  }
}

export function buildGooglePayScreen(ctx: ScreenBuildContext): ScreenContent {
  const bg = ctx.theme === 'dark' ? '#201F1F' : '#FFFFFF'
  const ink = ctx.theme === 'dark' ? '#E3E3E3' : '#1F1F1F'
  const muted = ctx.theme === 'dark' ? '#C4C7C5' : '#5F6368'
  const green = ctx.theme === 'dark' ? '#81C995' : '#137333'
  const font = ctx.device.fontFamily
  const v = vals(
    {
      title: 'Payment successful',
      amountFiat: '$45.00',
      recipient: 'Corner Market',
      date: 'Jul 26, 2026 · 14:26',
      walletType: 'Visa ···· 4242',
      status: 'Paid',
      other: 'Done',
      time: '14:26',
      battery: '87',
    },
    ctx.values,
  )
  const cx = ctx.width / 2
  const y0 = ctx.top + 56

  return {
    background: bg,
    palette: [bg, ink, green, muted],
    fields: [
      field('title', 'title', 'Title', 'Payment successful'),
      field('amountFiat', 'amountFiat', 'Amount', '$45.00'),
      field('recipient', 'recipient', 'Merchant', 'Corner Market'),
      field('date', 'date', 'Date', 'Jul 26, 2026 · 14:26'),
      field('walletType', 'walletType', 'Method', 'Visa ···· 4242'),
      field('status', 'status', 'Status', 'Paid'),
      field('time', 'time', 'Time', '14:26'),
      field('battery', 'battery', 'Battery %', '87'),
    ],
    objects: [
      ...successCheck('ok', cx, y0, 26, green, '#073B1A'),
      tag(
        textObj('title', v.title!, y0 + 72, cx, 18, 500, 'title', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('amountFiat', v.amountFiat!, y0 + 110, cx, 38, 500, 'amountFiat', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('recipient', v.recipient!, y0 + 162, cx, 15, 400, 'recipient', font, muted, {
          originX: 'center',
        }),
        'details',
      ),
      tag(
        textObj('date', v.date!, y0 + 190, cx, 13, 400, 'date', font, muted, {
          originX: 'center',
        }),
        'details',
      ),
      tag(
        textObj('walletType', v.walletType!, y0 + 228, cx, 13, 400, 'walletType', font, muted, {
          originX: 'center',
        }),
        'details',
      ),
      tag(
        textObj('status', v.status!, y0 + 268, cx, 14, 500, 'status', font, green, {
          originX: 'center',
        }),
        'details',
      ),
      tag(rect('ctaBg', 48, y0 + 330, ctx.width - 96, 50, '#8AB4F8', 25), 'cta'),
      tag(
        textObj('cta', v.other || 'Done', y0 + 344, cx, 15, 600, 'other', font, '#062E6F', {
          originX: 'center',
        }),
        'cta',
      ),
    ],
  }
}

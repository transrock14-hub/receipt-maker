import { vals } from './merge'
import { rect, textObj } from '../fabricHelpers'
import { coinbaseMark, metamaskMark } from '../tokenIcons'
import {
  detailList,
  field,
  isCompactHeight,
  navBackTitle,
  successCheck,
  tag,
  tagAll,
  type ScreenBuildContext,
  type ScreenContent,
} from '../screenUtils'
import { styleKitForInstitution } from '../../study/styleKits'

export function buildCoinbaseScreen(ctx: ScreenBuildContext): ScreenContent {
  const kit = styleKitForInstitution('coinbase-sent')
  const ink = ctx.colors.ink
  const muted = ctx.colors.muted
  const blue = ctx.colors.accent
  const bg = ctx.colors.background
  const line = ctx.colors.line
  const font = ctx.colors.fontFamily || kit?.fontFamily || '-apple-system, "SF Pro Text", system-ui, sans-serif'
  const v = vals(
    {
      title: 'Sent',
      amountCrypto: '45 USDT',
      amountFiat: '$45.00',
      status: 'Completed',
      recipient: '0x7a2f…4b2d',
      network: 'Base',
      fee: '$0.02',
      date: 'Jul 26, 2026 at 2:26 PM',
      other: 'View transaction',
      time: '9:41',
      battery: '100',
    },
    ctx.values,
  )
  const compact = isCompactHeight(ctx)
  const cx = ctx.width / 2
  const y0 = ctx.top + (compact ? 36 : (kit?.layout?.topInset ?? 52))
  const listY = y0 + (compact ? 160 : 186)
  const rowH = compact ? 38 : 44

  return {
    background: bg,
    palette: ctx.colors.palette.length ? ctx.colors.palette : kit?.palette || [bg, ink, blue, muted],
    fields: [
      field('title', 'title', 'Title', 'Sent'),
      field('amountCrypto', 'amountCrypto', 'Amount', '45 USDT'),
      field('amountFiat', 'amountFiat', 'Fiat', '$45.00'),
      field('status', 'status', 'Status', 'Completed'),
      field('recipient', 'recipient', 'To', '0x7a2f…4b2d'),
      field('networkName', 'network', 'Network', 'Base'),
      field('fee', 'fee', 'Fee', '$0.02'),
      field('date', 'date', 'Date', 'Jul 26, 2026 at 2:26 PM'),
      field('cta', 'other', 'CTA', 'View transaction'),
      field('time', 'time', 'Time', '9:41'),
      field('battery', 'battery', 'Battery %', '100'),
    ],
    objects: [
      ...tagAll(navBackTitle(ctx, 'Sent', { ink, font }, 'title'), 'header'),
      ...coinbaseMark('coin', cx, y0, compact ? 20 : 24),
      tag(
        textObj(
          'amountCrypto',
          v.amountCrypto!,
          y0 + (compact ? 52 : 62),
          cx,
          compact ? 24 : 28,
          600,
          'amountCrypto',
          font,
          ink,
          { originX: 'center' },
        ),
        'header',
      ),
      tag(
        textObj(
          'amountFiat',
          v.amountFiat!,
          y0 + (compact ? 82 : 98),
          cx,
          15,
          400,
          'amountFiat',
          font,
          muted,
          { originX: 'center' },
        ),
        'header',
      ),
      tag(rect('statusPill', cx - 54, y0 + (compact ? 108 : 128), 108, 28, ctx.theme === 'dark' ? '#1A2744' : '#E8F1FF', 14), 'header'),
      tag(
        textObj('status', v.status!, y0 + (compact ? 115 : 135), cx, 12, 600, 'status', font, blue, {
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
              mono: true,
            },
            {
              labelId: 'netL',
              label: 'Network',
              valueId: 'networkName',
              value: v.network!,
              fieldKey: 'network',
            },
            { labelId: 'feeL', label: 'Network fee', valueId: 'fee', value: v.fee!, fieldKey: 'fee' },
            { labelId: 'dateL', label: 'Date', valueId: 'date', value: v.date!, fieldKey: 'date' },
          ],
          { muted, ink, font, line },
          rowH,
        ),
        'details',
      ),
      tag(
        textObj('cta', v.other!, listY + 4 * rowH + 16, cx, 15, 600, 'other', font, blue, {
          originX: 'center',
        }),
        'cta',
      ),
    ],
  }
}

export function buildTrustScreen(ctx: ScreenBuildContext): ScreenContent {
  const kit = styleKitForInstitution('trust-send')
  const bg = ctx.colors.background
  const ink = ctx.colors.ink
  const muted = ctx.colors.muted
  const blue = ctx.colors.accent
  const green = ctx.colors.success
  const line = ctx.colors.line
  const font = ctx.colors.fontFamily || kit?.fontFamily || '-apple-system, "SF Pro Text", Roboto, sans-serif'
  const v = vals(
    {
      title: 'Send',
      amountCrypto: '-45 USDT',
      amountFiat: '$45.00',
      status: 'Success',
      recipient: '0x7a2f8c1d…c91e4b2d',
      network: 'Smart Chain',
      fee: '0.00021 BNB',
      date: '26 Jul 2026, 14:26',
      other: 'Done',
      time: '14:26',
      battery: '87',
    },
    ctx.values,
  )
  const compact = isCompactHeight(ctx)
  const cx = ctx.width / 2
  const y0 = ctx.top + (compact ? 36 : (kit?.layout?.topInset ?? 48))
  const listY = y0 + (compact ? 168 : 196)
  const rowH = compact ? 38 : 44

  return {
    background: bg,
    palette: ctx.colors.palette.length ? ctx.colors.palette : kit?.palette || [bg, ink, blue, green],
    fields: [
      field('title', 'title', 'Title', 'Send'),
      field('amountCrypto', 'amountCrypto', 'Amount', '-45 USDT'),
      field('amountFiat', 'amountFiat', 'Fiat', '$45.00'),
      field('status', 'status', 'Status', 'Success'),
      field('recipient', 'recipient', 'Recipient', '0x7a2f8c1d…c91e4b2d'),
      field('networkName', 'network', 'Network', 'Smart Chain'),
      field('fee', 'fee', 'Fee', '0.00021 BNB'),
      field('date', 'date', 'Date', '26 Jul 2026, 14:26'),
      field('time', 'time', 'Time', '14:26'),
      field('battery', 'battery', 'Battery %', '87'),
    ],
    objects: [
      ...tagAll(navBackTitle(ctx, 'Send', { ink, font }, 'title'), 'header'),
      ...successCheck('ok', cx, y0, compact ? 24 : 28, green),
      tag(
        textObj('status', v.status!, y0 + (compact ? 60 : 70), cx, 17, 600, 'status', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj(
          'amountCrypto',
          v.amountCrypto!,
          y0 + (compact ? 88 : 100),
          cx,
          compact ? 24 : 28,
          700,
          'amountCrypto',
          font,
          ink,
          { originX: 'center' },
        ),
        'header',
      ),
      tag(
        textObj(
          'amountFiat',
          v.amountFiat || '$45.00',
          y0 + (compact ? 118 : 136),
          cx,
          14,
          400,
          'amountFiat',
          font,
          muted,
          { originX: 'center' },
        ),
        'header',
      ),
      ...tagAll(
        detailList(
          ctx,
          listY,
          [
            {
              labelId: 'toL',
              label: 'Recipient',
              valueId: 'recipient',
              value: v.recipient!,
              fieldKey: 'recipient',
              mono: true,
            },
            {
              labelId: 'netL',
              label: 'Network',
              valueId: 'networkName',
              value: v.network!,
              fieldKey: 'network',
            },
            { labelId: 'feeL', label: 'Network Fee', valueId: 'fee', value: v.fee!, fieldKey: 'fee' },
            { labelId: 'dateL', label: 'Date', valueId: 'date', value: v.date!, fieldKey: 'date' },
          ],
          { muted, ink, font, line },
          rowH,
        ),
        'details',
      ),
      tag(rect('ctaBg', 24, listY + 4 * rowH + 20, ctx.width - 48, 50, blue, 25), 'cta'),
      tag(
        textObj('cta', v.other || 'Done', listY + 4 * rowH + 34, cx, 16, 600, 'other', font, '#fff', {
          originX: 'center',
        }),
        'cta',
      ),
    ],
  }
}

export function buildMetaMaskScreen(ctx: ScreenBuildContext): ScreenContent {
  const kit = styleKitForInstitution('metamask-activity')
  const bg = ctx.colors.background
  const ink = ctx.colors.ink
  const muted = ctx.colors.muted
  const orange = ctx.colors.accent
  const green = ctx.colors.success
  const line = ctx.colors.line
  const font = ctx.colors.fontFamily || kit?.fontFamily || 'Roboto, "Noto Sans", sans-serif'
  const v = vals(
    {
      title: 'Transaction',
      amountCrypto: '-45 USDT',
      amountFiat: '$45.00',
      status: 'Confirmed',
      recipient: '0x7a2f…4b2d',
      network: 'BNB Smart Chain',
      fee: '0.00021 BNB',
      date: 'Jul 26 · 14:26',
      other: 'View on block explorer',
      time: '14:26',
      battery: '87',
    },
    ctx.values,
  )
  const compact = isCompactHeight(ctx)
  const y0 = ctx.top + (compact ? 36 : (kit?.layout?.topInset ?? 48))
  const cx = ctx.width / 2
  const cardTop = y0 + (compact ? 28 : 36)
  const cardH = compact ? 120 : 136
  const listY = cardTop + cardH + 12
  const rowH = compact ? 36 : 42

  return {
    background: bg,
    palette: ctx.colors.palette.length ? ctx.colors.palette : kit?.palette || [bg, ink, orange, green],
    fields: [
      field('title', 'title', 'Title', 'Transaction'),
      field('amountCrypto', 'amountCrypto', 'Amount', '-45 USDT'),
      field('amountFiat', 'amountFiat', 'Fiat', '$45.00'),
      field('status', 'status', 'Status', 'Confirmed'),
      field('recipient', 'recipient', 'To', '0x7a2f…4b2d'),
      field('networkName', 'network', 'Network', 'BNB Smart Chain'),
      field('fee', 'fee', 'Gas', '0.00021 BNB'),
      field('date', 'date', 'Date', 'Jul 26 · 14:26'),
      field('cta', 'other', 'CTA', 'View on block explorer'),
      field('time', 'time', 'Time', '14:26'),
      field('battery', 'battery', 'Battery %', '87'),
    ],
    objects: [
      ...tagAll(navBackTitle(ctx, v.title || 'Transaction', { ink, font }), 'header'),
      ...metamaskMark('mm', cx, y0 - 2, compact ? 14 : 17),
      tag(rect('card', 16, cardTop, ctx.width - 32, cardH, ctx.theme === 'dark' ? '#2C3035' : '#FFFFFF', 14), 'header'),
      tag(
        textObj(
          'amountCrypto',
          v.amountCrypto!,
          cardTop + 18,
          cx,
          compact ? 20 : 24,
          700,
          'amountCrypto',
          font,
          ink,
          { originX: 'center' },
        ),
        'header',
      ),
      tag(
        textObj(
          'amountFiat',
          v.amountFiat!,
          cardTop + (compact ? 44 : 52),
          cx,
          13,
          400,
          'amountFiat',
          font,
          muted,
          { originX: 'center' },
        ),
        'header',
      ),
      tag(
        textObj('status', v.status!, cardTop + (compact ? 68 : 78), cx, 13, 600, 'status', font, green, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('date', v.date!, cardTop + (compact ? 90 : 102), cx, 12, 400, 'date', font, muted, {
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
              mono: true,
            },
            {
              labelId: 'netL',
              label: 'Network',
              valueId: 'networkName',
              value: v.network!,
              fieldKey: 'network',
            },
            { labelId: 'feeL', label: 'Gas', valueId: 'fee', value: v.fee!, fieldKey: 'fee' },
          ],
          { muted, ink, font, line },
          rowH,
        ),
        'details',
      ),
      tag(
        textObj('cta', v.other!, listY + 3 * rowH + 14, cx, 14, 500, 'other', font, orange, {
          originX: 'center',
        }),
        'cta',
      ),
    ],
  }
}

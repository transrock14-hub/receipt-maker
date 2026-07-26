import { vals } from './merge'
import { rect, textObj } from '../fabricHelpers'
import { wiseMark } from '../tokenIcons'
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
  const bg = '#0B0B0C'
  const ink = '#FFFFFF'
  const muted = '#8B8D97'
  const line = '#22232A'
  const green = '#2ECC71'
  const font = ctx.device.fontFamily
  const v = vals(
    {
      title: 'Payment completed',
      amountFiat: '-45.00 USD',
      status: 'Completed',
      recipient: 'Alex Rivera',
      date: '26 Jul 2026, 14:26',
      fee: 'No fee',
      walletType: 'USD · Main',
      time: '14:26',
      battery: '87',
    },
    ctx.values,
  )
  const cx = ctx.width / 2
  const y0 = ctx.top + 48
  const listY = y0 + 120

  return {
    background: bg,
    palette: [bg, ink, muted, green],
    fields: [
      field('title', 'title', 'Title', 'Payment completed'),
      field('amountFiat', 'amountFiat', 'Amount', '-45.00 USD'),
      field('status', 'status', 'Status', 'Completed'),
      field('recipient', 'recipient', 'To', 'Alex Rivera'),
      field('date', 'date', 'Date', '26 Jul 2026, 14:26'),
      field('fee', 'fee', 'Fee', 'No fee'),
      field('walletType', 'walletType', 'From', 'USD · Main'),
      field('time', 'time', 'Time', '14:26'),
      field('battery', 'battery', 'Battery %', '87'),
    ],
    objects: [
      ...tagAll(navBackTitle(ctx, v.title || 'Payment completed', { ink, font }), 'header'),
      tag(
        textObj('amountFiat', v.amountFiat!, y0, cx, 34, 600, 'amountFiat', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(rect('statusPill', cx - 48, y0 + 48, 96, 26, '#1A3D2A', 13), 'header'),
      tag(
        textObj('status', v.status!, y0 + 54, cx, 13, 500, 'status', font, green, {
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
          44,
        ),
        'details',
      ),
    ],
  }
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

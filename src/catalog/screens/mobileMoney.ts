import { vals } from './merge'
import { rect, textObj } from '../fabricHelpers'
import {
  brandHeader,
  detailList,
  field,
  navBackTitle,
  successCheck,
  tag,
  tagAll,
  type ScreenBuildContext,
  type ScreenContent,
} from '../screenUtils'

export function buildMpesaScreen(ctx: ScreenBuildContext): ScreenContent {
  const bg = '#FFFFFF'
  const ink = '#1A1A1A'
  const muted = '#667085'
  const green = '#4CAF50'
  const line = '#EAECF0'
  const font = ctx.device.fontFamily
  const v = vals(
    {
      title: 'M-PESA',
      amountFiat: 'Ksh45.00',
      status: 'Confirmed',
      recipient: 'Alex Rivera',
      accountOrIban: 'QWE7XK9M2P',
      date: '26/7/26 2:26 PM',
      fee: 'Ksh0.00',
      other: 'Give Alex Rivera Ksh45.00',
      time: '14:26',
      battery: '87',
    },
    ctx.values,
  )
  const hdrH = 48
  const y0 = ctx.top + hdrH + 20
  const listY = y0 + 150

  return {
    background: bg,
    palette: [bg, ink, green, muted],
    fields: [
      field('title', 'title', 'Title', 'M-PESA'),
      field('amountFiat', 'amountFiat', 'Amount', 'Ksh45.00'),
      field('status', 'status', 'Status', 'Confirmed'),
      field('recipient', 'recipient', 'To', 'Alex Rivera'),
      field('account', 'accountOrIban', 'Code', 'QWE7XK9M2P'),
      field('date', 'date', 'Date', '26/7/26 2:26 PM'),
      field('fee', 'fee', 'Fee', 'Ksh0.00'),
      field('cta', 'other', 'Message', 'Give Alex Rivera Ksh45.00'),
      field('time', 'time', 'Time', '14:26'),
      field('battery', 'battery', 'Battery %', '87'),
    ],
    objects: [
      ...tagAll(brandHeader(ctx, v.title || 'M-PESA', green, '#fff', { height: hdrH, font }), 'header'),
      tag(textObj('cta', v.other!, y0, 16, 14, 400, 'other', font, ink), 'header'),
      tag(textObj('amountFiat', v.amountFiat!, y0 + 36, 16, 30, 700, 'amountFiat', font, ink), 'header'),
      tag(textObj('status', v.status!, y0 + 80, 16, 14, 600, 'status', font, green), 'header'),
      tag(rect('smsCard', 12, y0 + 112, ctx.width - 24, 8, '#E8F5E9', 4), 'details'),
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
              labelId: 'codeL',
              label: 'Receipt No.',
              valueId: 'account',
              value: v.accountOrIban!,
              fieldKey: 'accountOrIban',
              mono: true,
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

export function buildMtnMomoScreen(ctx: ScreenBuildContext): ScreenContent {
  const bg = '#FFCC00'
  const ink = '#000000'
  const muted = '#333333'
  const font = ctx.device.fontFamily
  const v = vals(
    {
      title: 'Transfer Successful',
      amountFiat: '45.00 GHS',
      status: 'Successful',
      recipient: '024 *** **89',
      accountOrIban: 'TXN-88421',
      date: '26 Jul 2026 14:26',
      fee: '0.00 GHS',
      time: '14:26',
      battery: '87',
    },
    ctx.values,
  )
  const cx = ctx.width / 2
  const y0 = ctx.top + 52
  const cardTop = y0 + 120
  const listY = cardTop + 28

  return {
    background: bg,
    palette: [bg, ink, muted],
    fields: [
      field('title', 'title', 'Title', 'Transfer Successful'),
      field('amountFiat', 'amountFiat', 'Amount', '45.00 GHS'),
      field('status', 'status', 'Status', 'Successful'),
      field('recipient', 'recipient', 'To', '024 *** **89'),
      field('account', 'accountOrIban', 'Ref', 'TXN-88421'),
      field('date', 'date', 'Date', '26 Jul 2026 14:26'),
      field('fee', 'fee', 'Fee', '0.00 GHS'),
      field('time', 'time', 'Time', '14:26'),
      field('battery', 'battery', 'Battery %', '87'),
    ],
    objects: [
      ...tagAll(navBackTitle(ctx, 'MoMo', { ink, font }, null), 'header'),
      ...successCheck('ok', cx, y0 - 4, 22, '#0D7A3E'),
      tag(
        textObj('title', v.title!, y0 + 52, cx, 17, 700, 'title', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('amountFiat', v.amountFiat!, y0 + 84, cx, 30, 700, 'amountFiat', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(rect('card', 16, cardTop, ctx.width - 32, 240, '#FFFFFF', 14), 'details'),
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
              labelId: 'refL',
              label: 'Reference',
              valueId: 'account',
              value: v.accountOrIban!,
              fieldKey: 'accountOrIban',
              mono: true,
            },
            { labelId: 'dateL', label: 'Date', valueId: 'date', value: v.date!, fieldKey: 'date' },
            { labelId: 'feeL', label: 'Fee', valueId: 'fee', value: v.fee!, fieldKey: 'fee' },
          ],
          { muted, ink, font, line: '#EEEEEE' },
          44,
        ),
        'details',
      ),
    ],
  }
}

export function buildStcPayScreen(ctx: ScreenBuildContext): ScreenContent {
  const bg = '#4F008C'
  const ink = '#FFFFFF'
  const muted = 'rgba(255,255,255,0.75)'
  const font = ctx.device.fontFamily
  const v = vals(
    {
      title: 'Payment details',
      amountFiat: '45.00 SAR',
      status: 'Successful',
      recipient: 'Alex Rivera',
      accountOrIban: 'STC-99210',
      date: '26 Jul 2026, 14:26',
      fee: '0.00 SAR',
      time: '14:26',
      battery: '87',
    },
    ctx.values,
  )
  const cx = ctx.width / 2
  const y0 = ctx.top + 48
  const cardTop = y0 + 100
  const listY = cardTop + 28

  return {
    background: bg,
    palette: [bg, ink, '#7B2CBF'],
    fields: [
      field('title', 'title', 'Title', 'Payment details'),
      field('amountFiat', 'amountFiat', 'Amount', '45.00 SAR'),
      field('status', 'status', 'Status', 'Successful'),
      field('recipient', 'recipient', 'To', 'Alex Rivera'),
      field('account', 'accountOrIban', 'Ref', 'STC-99210'),
      field('date', 'date', 'Date', '26 Jul 2026, 14:26'),
      field('fee', 'fee', 'Fee', '0.00 SAR'),
      field('time', 'time', 'Time', '14:26'),
      field('battery', 'battery', 'Battery %', '87'),
    ],
    objects: [
      ...tagAll(navBackTitle(ctx, v.title || 'Payment details', { ink, font }), 'header'),
      tag(
        textObj('amountFiat', v.amountFiat!, y0, cx, 34, 700, 'amountFiat', font, ink, {
          originX: 'center',
        }),
        'header',
      ),
      tag(
        textObj('status', v.status!, y0 + 48, cx, 14, 500, 'status', font, '#B8F2C0', {
          originX: 'center',
        }),
        'header',
      ),
      tag(rect('card', 16, cardTop, ctx.width - 32, 250, 'rgba(255,255,255,0.12)', 16), 'details'),
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
              labelId: 'refL',
              label: 'Reference',
              valueId: 'account',
              value: v.accountOrIban!,
              fieldKey: 'accountOrIban',
              mono: true,
            },
            { labelId: 'dateL', label: 'Date', valueId: 'date', value: v.date!, fieldKey: 'date' },
            { labelId: 'feeL', label: 'Fee', valueId: 'fee', value: v.fee!, fieldKey: 'fee' },
          ],
          { muted, ink, font, line: 'rgba(255,255,255,0.15)' },
          44,
        ),
        'details',
      ),
    ],
  }
}

export function buildThermalScreen(ctx: ScreenBuildContext): ScreenContent {
  const bg = '#F7F4EA'
  const ink = '#1C1B18'
  const faded = '#5A574E'
  const mono = '"IBM Plex Mono", ui-monospace, monospace'
  const v = vals(
    {
      title: 'CORNER MARKET',
      date: '01/15/2026  14:32',
      amountFiat: 'TOTAL                  14.83',
      other: 'Organic Milk 1L          3.49',
      status: 'THANK YOU',
      accountOrIban: '****4521',
      time: '14:32',
      battery: '100',
    },
    ctx.values,
  )
  const w = ctx.width
  const top = ctx.top + 8

  // Jagged paper edge
  const jagged: ReturnType<typeof rect>[] = []
  for (let i = 0; i < 20; i++) {
    const x = (w / 20) * i
    const h = 3 + ((i * 7) % 5)
    jagged.push(rect(`jag${i}`, x, ctx.top, w / 20 + 1, h, i % 2 ? '#E8E2D4' : '#EDE8D8'))
  }

  // Barcode
  const bars: ReturnType<typeof rect>[] = []
  let bx = 36
  const pattern = [2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1]
  pattern.forEach((bw, i) => {
    if (i % 2 === 0) bars.push(rect(`bar${i}`, bx, top + 292, bw * 2.1, 38, ink))
    bx += bw * 2.1 + 1.1
  })

  // Soft ink-bleed under rules
  const bleed = rect('bleed', 28, top + 218, w - 56, 2, 'rgba(28,27,24,0.12)')

  return {
    background: bg,
    palette: [bg, ink, faded],
    fields: [
      field('title', 'title', 'Store', 'CORNER MARKET'),
      field('date', 'date', 'Date', '01/15/2026  14:32'),
      field('cta', 'other', 'Item', 'Organic Milk 1L          3.49'),
      field('amountFiat', 'amountFiat', 'Total', 'TOTAL                  14.83'),
      field('status', 'status', 'Footer', 'THANK YOU'),
      field('account', 'accountOrIban', 'Card', '****4521'),
      field('time', 'time', 'Time', '14:32'),
      field('battery', 'battery', 'Battery %', '100'),
    ],
    objects: [
      ...jagged,
      textObj('title', v.title!, top + 22, w / 2, 15, 700, 'title', mono, ink, {
        originX: 'center',
      }),
      textObj('addr', '12 Market St · City', top + 46, w / 2, 10, 400, null, mono, faded, {
        originX: 'center',
      }),
      textObj('tel', 'TEL 555-0142', top + 62, w / 2, 10, 400, null, mono, faded, {
        originX: 'center',
      }),
      textObj('date', v.date!, top + 88, 28, 11, 400, 'date', mono, ink),
      rect('rule1', 28, top + 108, w - 56, 1, ink),
      textObj('cta', v.other!, top + 124, 28, 12, 400, 'other', mono, ink),
      textObj('item2', 'Sourdough Loaf            4.25', top + 146, 28, 12, 400, null, mono, ink),
      textObj('item3', 'Espresso                  3.50', top + 168, 28, 12, 400, null, mono, ink),
      textObj('item4', 'Tax                       1.09', top + 190, 28, 12, 400, null, mono, faded),
      bleed,
      rect('rule2', 28, top + 220, w - 56, 1.5, ink),
      textObj('amountFiat', v.amountFiat!, top + 236, 28, 13, 700, 'amountFiat', mono, ink),
      textObj('card', `CARD ${v.accountOrIban}`, top + 262, 28, 11, 400, 'accountOrIban', mono, faded),
      ...bars,
      textObj('bcNum', '0 12345 67890 4', top + 338, w / 2, 10, 400, null, mono, faded, {
        originX: 'center',
      }),
      textObj('status', v.status!, top + 362, w / 2, 12, 400, 'status', mono, ink, {
        originX: 'center',
      }),
      // Bottom jagged edge
      ...Array.from({ length: 20 }, (_, i) => {
        const x = (w / 20) * i
        const h = 3 + ((i * 5) % 4)
        return rect(`bjag${i}`, x, top + 390, w / 20 + 1, h, i % 2 ? '#E8E2D4' : '#EDE8D8')
      }),
    ],
  }
}

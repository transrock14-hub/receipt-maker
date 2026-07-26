import type { GenerateValues } from '../../types/receipt'
import { label, rect, strokedRect, textObj } from '../fabricHelpers'
import { coinIconFor } from '../tokenIcons'
import {
  detailList,
  field,
  isCompactHeight,
  tag,
  tagAll,
  type ScreenBuildContext,
  type ScreenContent,
} from '../screenUtils'
import { styleKitForInstitution } from '../../study/styleKits'

/** Binance app uses a Roboto / system stack on Android. */
const BINANCE_SANS = 'Roboto, Inter, "Noto Sans", sans-serif'

/**
 * Defaults tuned to a real Binance Withdrawal Details capture
 * (Wallet → History → Withdrawal).
 */
const WITHDRAWAL_DEFAULTS: Partial<GenerateValues> = {
  title: 'Withdrawal Details',
  coin: 'USDT',
  amountCrypto: '-45 USDT',
  amountFiat: '≈ $45.00',
  status: 'Completed',
  recipient: '0x7a2f8c1d...c91e4b2d',
  network: 'BNB Smart Chain (BEP20)',
  price: '45 USDT',
  fee: '0.29 USDT',
  date: '2026-07-26 14:26:18',
  accountOrIban: '0x8f3a9c2e...a7e21c',
  walletType: 'Spot Wallet',
  other: 'View on blockchain explorer',
  time: '14:26',
  battery: '87',
}

/**
 * Binance Deposit Details — Wallet → History → Deposit (incoming).
 */
const DEPOSIT_DEFAULTS: Partial<GenerateValues> = {
  title: 'Deposit Details',
  coin: 'USDT',
  amountCrypto: '+45 USDT',
  amountFiat: '≈ $45.00',
  status: 'Completed',
  recipient: '0x7a2f8c1d...c91e4b2d',
  network: 'Tron (TRC20)',
  price: '45 USDT',
  fee: '0 USDT',
  date: '2026-07-26 14:26:18',
  accountOrIban: '0x8f3a9c2e...a7e21c',
  walletType: 'Spot Wallet',
  other: 'View on blockchain explorer',
  time: '14:26',
  battery: '87',
}

/** Binance Android share — square outline + upward arrow (Material-ish). */
function binanceShare(x: number, y: number, ink: string, font: string) {
  return [
    { ...strokedRect('shareBox', x, y + 3, 14, 11, ink, 2.2, 1.35), receiptGroup: 'header' },
    { ...rect('shareStem', x + 6.2, y - 1, 1.6, 9, ink, 0.6), receiptGroup: 'header' },
    label('shareArrow', '⌃', y - 5, x + 2.2, 12, 700, font, ink),
  ]
}

/** Back + centered title + share affordance (Binance Android header). */
function binanceNav(ctx: ScreenBuildContext, title: string, ink: string, font: string) {
  const y = ctx.top + 10
  const shareX = ctx.width - 34
  return [
    label('back', '←', y - 1, 14, 22, 300, font, ink),
    textObj('title', title, y + 3, ctx.width / 2, 17, 600, 'title', font, ink, {
      originX: 'center',
    }),
    ...binanceShare(shareX, y + 4, ink, font),
  ]
}

type BinanceKind = 'withdrawal' | 'deposit'

function buildBinanceKind(ctx: ScreenBuildContext, kind: BinanceKind): ScreenContent {
  const institutionId = kind === 'deposit' ? 'binance-deposit' : 'binance-withdrawal'
  const defaults = kind === 'deposit' ? DEPOSIT_DEFAULTS : WITHDRAWAL_DEFAULTS
  const kit = styleKitForInstitution(institutionId)
  const v = { ...defaults, ...kit?.defaults, ...ctx.values }
  const ink = ctx.colors.ink
  const muted = ctx.colors.muted
  const yellow = ctx.colors.accent
  const green = ctx.colors.success
  const line = ctx.colors.line
  const bg = ctx.colors.background
  const font = ctx.colors.fontFamily || kit?.fontFamily || BINANCE_SANS
  const compact = isCompactHeight(ctx)
  const inset = compact ? 36 : (kit?.layout?.topInset ?? 52)
  const side = 16
  const cx = ctx.width / 2
  const y0 = ctx.top + inset
  const coinR = compact ? 22 : 26
  const afterCoin = y0 + coinR * 2 + (compact ? 10 : 16)
  const amtGap = compact ? 26 : 34
  const listY = afterCoin + (compact ? 78 : 100)
  const rowH = compact ? 38 : 44
  const rows = 8
  const ctaY = listY + rows * rowH + (compact ? 12 : 20)
  const amountSize = compact ? 24 : 28

  const txid = (v.accountOrIban || defaults.accountOrIban || '').replace(/\s*>\s*$/, '')
  const coinSym = (v.coin || 'USDT').toUpperCase()
  const amountLabel = kind === 'deposit' ? 'Deposit amount' : 'Withdraw amount'
  const addressLabel = kind === 'deposit' ? 'From' : 'Address'
  const fallbackAmount = kind === 'deposit' ? '+45 USDT' : '-45 USDT'
  const navTitle =
    v.title || (kind === 'deposit' ? 'Deposit Details' : 'Withdrawal Details')

  const objects = [
    ...tagAll(binanceNav(ctx, navTitle, ink, font), 'header'),
    ...coinIconFor(coinSym, 'coinMark', cx, y0, coinR),
    tag(
      textObj(
        'amountCrypto',
        v.amountCrypto || fallbackAmount,
        afterCoin,
        cx,
        amountSize,
        500,
        'amountCrypto',
        font,
        kind === 'deposit' ? green : ink,
        { originX: 'center' },
      ),
      'header',
    ),
    tag(
      textObj(
        'amountFiat',
        v.amountFiat || '≈ $45.00',
        afterCoin + amtGap,
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
      textObj(
        'status',
        v.status || 'Completed',
        afterCoin + amtGap + 22,
        cx,
        13,
        500,
        'status',
        font,
        green,
        { originX: 'center' },
      ),
      'header',
    ),
    ...tagAll(
      detailList(
        ctx,
        listY,
        [
          { labelId: 'coinL', label: 'Coin', valueId: 'coin', value: coinSym, fieldKey: 'coin' },
          {
            labelId: 'addrL',
            label: addressLabel,
            valueId: 'recipient',
            value: v.recipient || '',
            fieldKey: 'recipient',
            mono: true,
          },
          {
            labelId: 'netL',
            label: 'Network',
            valueId: 'networkName',
            value: v.network || '',
            fieldKey: 'network',
          },
          {
            labelId: 'amtL',
            label: amountLabel,
            valueId: 'price',
            value: v.price || '',
            fieldKey: 'price',
          },
          { labelId: 'feeL', label: 'Network fee', valueId: 'fee', value: v.fee || '', fieldKey: 'fee' },
          { labelId: 'dateL', label: 'Date', valueId: 'date', value: v.date || '', fieldKey: 'date' },
          {
            labelId: 'txL',
            label: 'TxID',
            valueId: 'account',
            value: txid,
            fieldKey: 'accountOrIban',
            mono: true,
            accent: yellow,
            valuePadRight: 18,
          },
          {
            labelId: 'walL',
            label: 'Wallet',
            valueId: 'walletType',
            value: v.walletType || 'Spot Wallet',
            fieldKey: 'walletType',
          },
        ],
        { muted, ink, font, line, labelSize: 13, valueSize: 13, side },
        rowH,
      ),
      'details',
    ),
    tag(
      label(
        'txChevron',
        '›',
        listY + 6 * rowH - 1,
        ctx.width - side,
        16,
        400,
        font,
        yellow,
        { originX: 'right' },
      ),
      'details',
    ),
    tag(
      textObj(
        'cta',
        v.other || 'View on blockchain explorer',
        ctaY,
        cx,
        14,
        500,
        'other',
        font,
        yellow,
        { originX: 'center' },
      ),
      'cta',
    ),
  ]

  return {
    objects,
    background: bg,
    palette: ctx.colors.palette.length
      ? ctx.colors.palette
      : kit?.palette || [bg, ink, yellow, green, '#26A17B', muted],
    fields: [
      field('title', 'title', 'Title', defaults.title!),
      field('coin', 'coin', 'Coin', defaults.coin!),
      field('amountCrypto', 'amountCrypto', 'Amount', defaults.amountCrypto!),
      field('amountFiat', 'amountFiat', 'Fiat', defaults.amountFiat!),
      field('status', 'status', 'Status', defaults.status!),
      field('recipient', 'recipient', addressLabel, defaults.recipient!),
      field('networkName', 'network', 'Network', defaults.network!),
      field('price', 'price', amountLabel, defaults.price!),
      field('fee', 'fee', 'Fee', defaults.fee!),
      field('date', 'date', 'Date', defaults.date!),
      field('account', 'accountOrIban', 'TxID', defaults.accountOrIban!),
      field('walletType', 'walletType', 'Wallet', defaults.walletType!),
      field('cta', 'other', 'CTA', defaults.other!),
      field('time', 'time', 'Time', defaults.time!),
      field('battery', 'battery', 'Battery %', defaults.battery!),
    ],
  }
}

export function buildBinanceScreen(ctx: ScreenBuildContext): ScreenContent {
  return buildBinanceKind(ctx, 'withdrawal')
}

export function buildBinanceDepositScreen(ctx: ScreenBuildContext): ScreenContent {
  return buildBinanceKind(ctx, 'deposit')
}

export const BINANCE_DEFAULTS = WITHDRAWAL_DEFAULTS
export const BINANCE_DEPOSIT_DEFAULTS = DEPOSIT_DEFAULTS

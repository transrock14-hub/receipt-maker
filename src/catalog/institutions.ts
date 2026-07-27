import type {
  DeviceId,
  GenerateValues,
  InstitutionCategory,
  InstitutionScreen,
} from '../types/receipt'
import { BINANCE_DEFAULTS, BINANCE_DEPOSIT_DEFAULTS, buildBinanceDepositScreen, buildBinanceScreen } from './screens/binance'
import {
  buildCoinbaseReceivedScreen,
  buildCoinbaseScreen,
  buildMetaMaskReceivedScreen,
  buildMetaMaskScreen,
  buildTrustReceiveScreen,
  buildTrustScreen,
} from './screens/crypto'
import {
  buildCashAppScreen,
  buildGooglePayScreen,
  buildPayPalScreen,
  buildVenmoScreen,
} from './screens/fintech'
import {
  buildBoaScreen,
  buildChaseScreen,
  buildRevolutScreen,
  buildWiseScreen,
  REVOLUT_DEFAULTS,
} from './screens/banks'
import {
  buildMpesaScreen,
  buildMtnMomoScreen,
  buildStcPayScreen,
  buildThermalScreen,
} from './screens/mobileMoney'
import type { ScreenBuildContext, ScreenContent } from './screenUtils'

export type ScreenBuilder = (ctx: ScreenBuildContext) => ScreenContent

export interface InstitutionDef extends InstitutionScreen {
  build: ScreenBuilder
  chromeInk: string
  chromeBar?: string
  /** Real institution URL for desktop browser chrome. */
  appUrl?: string
}

function def(
  partial: Omit<InstitutionDef, 'fields' | 'palette' | 'background' | 'defaults'> & {
    defaults?: Partial<GenerateValues>
  },
): InstitutionDef {
  // fields/palette/background filled at compose from build()
  return {
    fields: [],
    palette: [],
    background: '#000',
    defaults: partial.defaults || {},
    ...partial,
  }
}

export const INSTITUTIONS: InstitutionDef[] = [
  def({
    id: 'binance-withdrawal',
    name: 'Withdrawal Details',
    brand: 'Binance',
    category: 'crypto',
    recommendedDeviceIds: ['s24-ultra', 's25-ultra', 'iphone-16-pro'],
    build: buildBinanceScreen,
    chromeInk: '#EAECEF',
    appUrl: 'https://app.binance.com/wallet/withdraw/detail',
    defaults: BINANCE_DEFAULTS,
  }),
  def({
    id: 'binance-deposit',
    name: 'Deposit Details',
    brand: 'Binance',
    category: 'crypto',
    recommendedDeviceIds: ['s24-ultra', 's25-ultra', 'iphone-16-pro'],
    build: buildBinanceDepositScreen,
    chromeInk: '#EAECEF',
    appUrl: 'https://app.binance.com/wallet/deposit/detail',
    defaults: BINANCE_DEPOSIT_DEFAULTS,
  }),
  def({
    id: 'coinbase-sent',
    name: 'Sent',
    brand: 'Coinbase',
    category: 'crypto',
    recommendedDeviceIds: ['iphone-16-pro', 'iphone-16-pro-max', 'pixel-9-pro'],
    build: buildCoinbaseScreen,
    chromeInk: '#0A0B0D',
    appUrl: 'https://www.coinbase.com/activity',
    defaults: {
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
      phoneType: 'iPhone 16 Pro',
    },
  }),
  def({
    id: 'coinbase-received',
    name: 'Received',
    brand: 'Coinbase',
    category: 'crypto',
    recommendedDeviceIds: ['iphone-16-pro', 'iphone-16-pro-max', 'pixel-9-pro'],
    build: buildCoinbaseReceivedScreen,
    chromeInk: '#0A0B0D',
    appUrl: 'https://www.coinbase.com/activity',
    defaults: {
      title: 'Received',
      amountCrypto: '+45 USDT',
      amountFiat: '$45.00',
      status: 'Completed',
      recipient: '0x7a2f…4b2d',
      network: 'Base',
      fee: '$0.00',
      date: 'Jul 26, 2026 at 2:26 PM',
      other: 'View transaction',
      time: '9:41',
      battery: '100',
      phoneType: 'iPhone 16 Pro',
    },
  }),
  def({
    id: 'trust-send',
    name: 'Send success',
    brand: 'Trust Wallet',
    category: 'crypto',
    recommendedDeviceIds: ['iphone-15', 's23'],
    build: buildTrustScreen,
    chromeInk: '#17171A',
    appUrl: 'https://trustwallet.com',
    defaults: {
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
  }),
  def({
    id: 'trust-receive',
    name: 'Receive success',
    brand: 'Trust Wallet',
    category: 'crypto',
    recommendedDeviceIds: ['iphone-15', 's23'],
    build: buildTrustReceiveScreen,
    chromeInk: '#17171A',
    appUrl: 'https://trustwallet.com',
    defaults: {
      title: 'Receive',
      amountCrypto: '+45 USDT',
      amountFiat: '$45.00',
      status: 'Success',
      recipient: '0x7a2f8c1d…c91e4b2d',
      network: 'Smart Chain',
      fee: '0 BNB',
      date: '26 Jul 2026, 14:26',
      other: 'Done',
      time: '14:26',
      battery: '87',
    },
  }),
  def({
    id: 'metamask-activity',
    name: 'Activity',
    brand: 'MetaMask',
    category: 'crypto',
    recommendedDeviceIds: ['iphone-16-pro', 'pixel-8'],
    build: buildMetaMaskScreen,
    chromeInk: '#FCFCFC',
    appUrl: 'https://portfolio.metamask.io/activity',
    defaults: {
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
  }),
  def({
    id: 'metamask-received',
    name: 'Received',
    brand: 'MetaMask',
    category: 'crypto',
    recommendedDeviceIds: ['iphone-16-pro', 'pixel-8'],
    build: buildMetaMaskReceivedScreen,
    chromeInk: '#FCFCFC',
    appUrl: 'https://portfolio.metamask.io/activity',
    defaults: {
      title: 'Received',
      amountCrypto: '+45 USDT',
      amountFiat: '$45.00',
      status: 'Confirmed',
      recipient: '0x7a2f…4b2d',
      network: 'BNB Smart Chain',
      fee: '0 BNB',
      date: 'Jul 26 · 14:26',
      other: 'View on block explorer',
      time: '14:26',
      battery: '87',
    },
  }),
  def({
    id: 'paypal-sent',
    name: 'Money sent',
    brand: 'PayPal',
    category: 'fintech',
    recommendedDeviceIds: ['iphone-16-pro', 'desktop-macos'],
    build: buildPayPalScreen,
    chromeInk: '#001C64',
    chromeBar: '#F5F7FA',
    appUrl: 'https://www.paypal.com/myaccount/activity',
  }),
  def({
    id: 'cashapp-payment',
    name: 'Payment',
    brand: 'Cash App',
    category: 'fintech',
    recommendedDeviceIds: ['iphone-15', 's24-ultra'],
    build: buildCashAppScreen,
    chromeInk: '#FFFFFF',
    appUrl: 'https://cash.app',
  }),
  def({
    id: 'venmo-payment',
    name: 'Payment',
    brand: 'Venmo',
    category: 'fintech',
    recommendedDeviceIds: ['iphone-16-pro', 'iphone-se'],
    build: buildVenmoScreen,
    chromeInk: '#2F3033',
  }),
  def({
    id: 'gpay-success',
    name: 'Payment successful',
    brand: 'Google Pay',
    category: 'fintech',
    recommendedDeviceIds: ['pixel-9-pro', 'pixel-8', 's25-ultra'],
    build: buildGooglePayScreen,
    chromeInk: '#E3E3E3',
  }),
  def({
    id: 'chase-transfer',
    name: 'Transfer details',
    brand: 'Chase',
    category: 'bank',
    recommendedDeviceIds: ['iphone-16-pro', 's24-ultra'],
    build: buildChaseScreen,
    chromeInk: '#0C2340',
    appUrl: 'https://secure.chase.com/web/auth',
  }),
  def({
    id: 'boa-transfer',
    name: 'Transfer details',
    brand: 'Bank of America',
    category: 'bank',
    recommendedDeviceIds: ['iphone-15', 'pixel-8'],
    build: buildBoaScreen,
    chromeInk: '#012169',
    appUrl: 'https://secure.bankofamerica.com',
  }),
  def({
    id: 'revolut-payment',
    name: 'Transfer completed',
    brand: 'Revolut',
    category: 'bank',
    recommendedDeviceIds: ['s23', 'pixel-8', 'iphone-16-pro'],
    build: buildRevolutScreen,
    chromeInk: '#FFFFFF',
    chromeBar: '#000000',
    appUrl: 'https://app.revolut.com',
    defaults: { ...REVOLUT_DEFAULTS },
  }),
  def({
    id: 'wise-sent',
    name: 'Money sent',
    brand: 'Wise',
    category: 'bank',
    recommendedDeviceIds: ['iphone-16-pro', 'desktop-macos'],
    build: buildWiseScreen,
    chromeInk: '#0E0F11',
    chromeBar: '#F2F2F2',
    appUrl: 'https://wise.com/transactions',
  }),
  def({
    id: 'mpesa-confirm',
    name: 'Confirmation',
    brand: 'M-Pesa',
    category: 'mobile',
    recommendedDeviceIds: ['s24-ultra', 'pixel-8'],
    build: buildMpesaScreen,
    chromeInk: '#1A1A1A',
  }),
  def({
    id: 'mtn-momo',
    name: 'Transfer Successful',
    brand: 'MTN MoMo',
    category: 'mobile',
    recommendedDeviceIds: ['s23', 'pixel-8'],
    build: buildMtnMomoScreen,
    chromeInk: '#000000',
  }),
  def({
    id: 'stc-pay',
    name: 'Payment details',
    brand: 'STC Pay',
    category: 'mobile',
    recommendedDeviceIds: ['s24-ultra', 'iphone-15'],
    build: buildStcPayScreen,
    chromeInk: '#FFFFFF',
  }),
  def({
    id: 'thermal-store',
    name: 'Store receipt',
    brand: 'Thermal',
    category: 'thermal',
    recommendedDeviceIds: ['iphone-se', 's23'],
    build: buildThermalScreen,
    chromeInk: '#1C1B18',
  }),
]

export function getInstitution(id: string): InstitutionDef {
  const i = INSTITUTIONS.find((x) => x.id === id)
  if (!i) throw new Error(`Unknown institution: ${id}`)
  return i
}

export function institutionsByCategory(): Record<InstitutionCategory, InstitutionDef[]> {
  const map = {} as Record<InstitutionCategory, InstitutionDef[]>
  for (const inst of INSTITUTIONS) {
    if (!map[inst.category]) map[inst.category] = []
    map[inst.category].push(inst)
  }
  return map
}

export function defaultDeviceFor(institutionId: string): DeviceId {
  const inst = getInstitution(institutionId)
  return inst.recommendedDeviceIds[0]
}

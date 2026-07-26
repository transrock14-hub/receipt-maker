import type {
  DeviceId,
  GenerateValues,
  ReceiptTemplate,
  TemplateField,
} from '../types/receipt'
import { EMPTY_GENERATE_VALUES } from '../types/receipt'
import { styleKitForInstitution } from '../study/styleKits'
import { applyGenerateValuesToCanvasJson } from './applyValues'
import { catalogThumbnail } from './catalogThumb'
import { buildDeviceChrome, getDevice } from './devices'
import { INSTITUTIONS, getInstitution } from './institutions'
import {
  defaultThemeForInstitution,
  resolveThemeColors,
  type ScreenTheme,
} from './screenTheme'

export interface ComposedScreenshot {
  width: number
  height: number
  canvasJson: Record<string, unknown>
  fields: TemplateField[]
  palette: string[]
  background: string
  deviceId: DeviceId
  institutionId: string
  name: string
  theme: ScreenTheme
}

export function composeScreenshot(
  deviceId: DeviceId,
  institutionId: string,
  values: Partial<GenerateValues> = {},
  theme?: ScreenTheme,
): ComposedScreenshot {
  const device = getDevice(deviceId)
  const institution = getInstitution(institutionId)
  const kit = styleKitForInstitution(institutionId)
  const screenTheme = theme ?? defaultThemeForInstitution(institutionId)
  const colors = resolveThemeColors(institutionId, screenTheme)
  const merged: GenerateValues = {
    ...EMPTY_GENERATE_VALUES,
    ...institution.defaults,
    ...kit?.defaults,
    ...values,
    phoneType: values.phoneType || device.name,
  }

  const content = institution.build({
    device,
    top: device.contentTop,
    width: device.width,
    height: device.height,
    values: merged,
    theme: screenTheme,
    colors,
  })

  const chromeInk = colors.chromeInk || kit?.chromeInk || institution.chromeInk
  const chrome = buildDeviceChrome(
    deviceId,
    merged,
    chromeInk,
    institution.chromeBar || content.background,
    institution.appUrl,
  )

  const objects = [...chrome, ...content.objects]
  const canvasJson = {
    version: '7.4.0',
    objects,
    background: content.background,
  }

  const applied = applyGenerateValuesToCanvasJson(canvasJson, content.fields, merged)

  return {
    width: device.width,
    height: device.height,
    canvasJson: applied,
    fields: content.fields,
    palette: content.palette.length ? content.palette : colors.palette,
    background: content.background,
    deviceId,
    institutionId,
    theme: screenTheme,
    name: `${institution.brand} · ${institution.name} · ${device.name}`,
  }
}

export function composedToTemplate(composed: ComposedScreenshot): ReceiptTemplate {
  const now = new Date().toISOString()
  const institution = getInstitution(composed.institutionId)
  const kit = styleKitForInstitution(composed.institutionId)
  return {
    id: `catalog-${composed.institutionId}-${composed.deviceId}`,
    name: composed.name,
    createdAt: now,
    updatedAt: now,
    width: composed.width,
    height: composed.height,
    canvasJson: composed.canvasJson,
    fields: composed.fields,
    palette: composed.palette,
    thumbnail: catalogThumbnail(
      composed.background,
      institution.brand,
      kit?.accent || composed.palette[2],
    ),
    isStarter: true,
    category: institution.category,
    deviceId: composed.deviceId,
    institutionId: composed.institutionId,
  }
}

/** Seed one template per institution × each recommended device. */
export function buildCatalogTemplates(): ReceiptTemplate[] {
  const out: ReceiptTemplate[] = []
  for (const inst of INSTITUTIONS) {
    for (const deviceId of inst.recommendedDeviceIds) {
      const composed = composeScreenshot(deviceId, inst.id, inst.defaults)
      out.push(composedToTemplate(composed))
    }
  }
  return out
}

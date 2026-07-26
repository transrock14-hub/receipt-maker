#!/usr/bin/env node
/**
 * Deploy Receipt Maker zip to Hostinger shared hosting via API.
 * Usage: HOSTINGER_API_TOKEN=... node scripts/hostinger-deploy.mjs [domain] [zipPath]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import axios from 'axios'
import * as tus from 'tus-js-client'

const token = process.env.HOSTINGER_API_TOKEN || process.env.API_TOKEN
if (!token) {
  console.error('Set HOSTINGER_API_TOKEN')
  process.exit(1)
}

const baseUrl = (process.env.API_BASE_URL || 'https://developers.hostinger.com').replace(/\/$/, '')
const domain = process.argv[2] || 'codecircuit.space'
const archivePath = path.resolve(
  process.argv[3] ||
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'deploy', 'receipt-maker-codecircuit.zip'),
)

if (!fs.existsSync(archivePath)) {
  console.error('Zip not found:', archivePath)
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${token}`,
  'User-Agent': 'receipt-maker-hostinger-deploy/1.0',
}

async function resolveUsername(d) {
  const url = `${baseUrl}/api/hosting/v1/websites?domain=${encodeURIComponent(d)}`
  const res = await axios.get(url, { headers, timeout: 60000 })
  const websites = res.data?.data
  if (!websites?.length) throw new Error(`No website for ${d}`)
  return websites[0].username
}

async function fetchUploadCredentials(username, d) {
  const res = await axios.post(
    `${baseUrl}/api/hosting/v1/files/upload-urls`,
    { username, domain: d },
    { headers: { ...headers, 'Content-Type': 'application/json' }, timeout: 60000 },
  )
  return res.data
}

function uploadFile(filePath, relativePath, uploadUrl, authRestToken, authToken) {
  return new Promise(async (resolve, reject) => {
    try {
      const stats = fs.statSync(filePath)
      const cleanUploadUrl = uploadUrl.replace(/\/$/, '')
      const normalizedPath = relativePath.replace(/\\/g, '/')
      const uploadUrlWithFile = `${cleanUploadUrl}/${normalizedPath}?override=true`
      const requestHeaders = {
        'X-Auth': authToken,
        'X-Auth-Rest': authRestToken,
        'upload-length': String(stats.size),
        'upload-offset': '0',
      }

      await axios.post(uploadUrlWithFile, '', {
        headers: requestHeaders,
        timeout: 60000,
        validateStatus: (s) => s === 201,
      })

      const fileStream = fs.createReadStream(filePath)
      const upload = new tus.Upload(fileStream, {
        uploadUrl: uploadUrlWithFile,
        retryDelays: [1000, 2000, 4000, 8000, 16000],
        uploadDataDuringCreation: false,
        parallelUploads: 1,
        chunkSize: 10485760,
        headers: requestHeaders,
        removeFingerprintOnSuccess: true,
        uploadSize: stats.size,
        metadata: { filename: path.basename(relativePath) },
        onError: (err) => reject(err),
        onSuccess: () => resolve({ filename: relativePath }),
      })
      upload.start()
    } catch (err) {
      reject(err)
    }
  })
}

async function triggerDeploy(username, d, archiveBasename) {
  const url = `${baseUrl}/api/hosting/v1/accounts/${username}/websites/${d}/deploy`
  const attempts = [
    { archive_path: `public_html/${archiveBasename}` },
    { archive_path: archiveBasename },
  ]
  let lastErr
  for (const body of attempts) {
    try {
      const res = await axios.post(url, body, {
        headers: { ...headers, 'Content-Type': 'application/json' },
        timeout: 120000,
        validateStatus: (s) => s < 500,
      })
      if (res.status === 200) return { body, data: res.data }
      lastErr = new Error(`status ${res.status}: ${JSON.stringify(res.data)}`)
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

const username = await resolveUsername(domain)
console.log('username:', username)
const creds = await fetchUploadCredentials(username, domain)
const { url: uploadUrl, auth_key: authToken, rest_auth_key: authRestToken } = creds
if (!uploadUrl || !authToken || !authRestToken) throw new Error('Bad upload credentials')

const archiveBasename = path.basename(archivePath)
console.log('uploading', archiveBasename, '…')
await uploadFile(archivePath, archiveBasename, uploadUrl, authRestToken, authToken)
console.log('upload ok')

console.log('triggering deploy…')
const deploy = await triggerDeploy(username, domain, archiveBasename)
console.log('deploy ok', JSON.stringify(deploy, null, 2))
console.log(`Site: https://${domain}/`)

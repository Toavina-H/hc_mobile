import Config from "react-native-config"

const AWS_API_GATEWAY_URL = Config.AWS_API_GATEWAY_URL
const AWS_S3_URL = Config.AWS_S3_URL
const AWS_CDN_UPLOAD_PREFIX = Config.AWS_CDN_UPLOAD_PREFIX

const API_KEY = Config.STELACE_PUBLISHABLE_API_KEY

export function sanitizeFilename (val) {
  val = val.normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '').replaceAll('&nbsp;', '').trim().replaceAll(/\s+/g, '_').replaceAll(/['’]/g, '_').replaceAll(/[^a-zA-Z0-9_-]/g, '').replaceAll(/_+/g, '_')
  return val
}

function cleanPrefix(prefix = '') {
  return prefix
    .replace(/\/{2,}/g, '/')
    .replace(/^\//, '')
    .replace(/([^/]+)(\/)?$/, '$1/')
}

function parseS3Url(url) {
  const parsed = new URL(url)
  const endpoint_url = `${parsed.origin}/`
  const key = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  return { endpoint_url, fullUrl: url, key }
}

function getFileKey(fileUrl) {
  const urlS3CdnPrefix = `${AWS_S3_URL}${AWS_CDN_UPLOAD_PREFIX}`
  return fileUrl.replace(urlS3CdnPrefix, '').replace(/^\//, '')
}

// file: { uri, name, type } from react-native-document-picker
// options: { uploadFolder, uploadPrefix, contentType, id }
async function uploadFileToS3({ file, options = {} }) {
  try {
    if (!file) return null

    let prefix = options.uploadPrefix
    if (prefix === 'timestamp') prefix = Date.now()

    const id = options.id ?? Date.now().toString()
    const ext = file.name.split('.').pop()
    const filename = `${prefix ? `${prefix}_` : ''}${sanitizeFilename(id)}.${ext}`
    const folder = cleanPrefix(AWS_CDN_UPLOAD_PREFIX) + (options.uploadFolder ?? 'missingUploadFolder')
    const contentType = options.contentType ?? file.type

    // asking lambda
    const policyRes = await fetch(`${AWS_API_GATEWAY_URL}upload-policy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ filename, folder, contentType }),
    })
    if (!policyRes.ok) return null
    const { body } = await policyRes.json()
    const S3Sign = parseS3Url(body)

    // Step 2: convert the local file URI into a blob RN can PUT
    const fileBlob = await fetch(file.uri).then((r) => r.blob())

    const putHeaders = { 'Content-Type': contentType }
    if (contentType === 'application/pdf') putHeaders['Content-Disposition'] = 'inline'

    const putRes = await fetch(S3Sign.fullUrl, {
      method: 'PUT',
      headers: putHeaders,
      body: fileBlob,
    })
    if (putRes.status !== 200) return null

    const fileUrl = putRes.url.split('?')[0]
    return getFileKey(fileUrl)
  } catch (e) {
    console.log('S3 upload failed', e)
    return null
  }
}

const aws = {
    files: { uploadFileToS3 }
}

export default aws
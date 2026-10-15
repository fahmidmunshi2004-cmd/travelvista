import { getBlob, ref, uploadBytesResumable, type UploadTaskSnapshot } from 'firebase/storage'
import { getStorage } from 'firebase/storage'
import { requireFirebaseApp } from './firebaseApp'

const MAX_FILE_SIZE = 15 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'])

export function uploadMemory(file: File, onProgress?: (percent: number) => void): Promise<string> {
  if (!ACCEPTED_TYPES.has(file.type)) return Promise.reject(new Error('Unsupported image or video format.'))
  if (file.size > MAX_FILE_SIZE) return Promise.reject(new Error('Files must be 15 MB or smaller.'))

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const task = uploadBytesResumable(ref(getStorage(requireFirebaseApp()), `media/${Date.now()}-${safeName}`), file, { contentType: file.type })
  return new Promise((resolve, reject) => {
    task.on('state_changed', (snapshot: UploadTaskSnapshot) => {
      onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
    }, reject, () => resolve(task.snapshot.ref.fullPath))
  })
}

export async function loadMemory(path: string): Promise<string> {
  const blob = await getBlob(ref(getStorage(requireFirebaseApp()), path))
  return URL.createObjectURL(blob)
}

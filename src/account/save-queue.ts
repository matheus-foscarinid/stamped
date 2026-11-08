import type { SendOptions } from './api.ts'

interface SaveQueueOptions<Body> {
  send: (body: Body, options: SendOptions) => Promise<void>
  merge: (older: Body, newer: Body) => Body
  delayMs: number
  onFailure: (error: unknown) => void
}

export interface SaveQueue<Body> {
  push: (body: Body) => void
  flush: (options?: SendOptions) => Promise<void>
  discard: () => void
  isIdle: () => boolean
}

// one save in flight at a time, so an older body never lands after a newer one
export const createSaveQueue = <Body>({
  send,
  merge,
  delayMs,
  onFailure,
}: SaveQueueOptions<Body>): SaveQueue<Body> => {
  let pending: Body | null = null
  let inFlight: Promise<void> | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  const keepBehindPending = (body: Body) => {
    pending = pending === null ? body : merge(body, pending)
  }

  const sendPending = async (options: SendOptions) => {
    const body = pending
    if (body === null) return
    pending = null
    try {
      await send(body, options)
    } catch (error) {
      keepBehindPending(body)
      onFailure(error)
    }
  }

  const flush = async (options: SendOptions = {}) => {
    clearTimeout(timer)
    while (inFlight !== null) await inFlight
    inFlight = sendPending(options)
    try {
      await inFlight
    } finally {
      inFlight = null
    }
  }

  const push = (body: Body) => {
    pending = pending === null ? body : merge(pending, body)
    clearTimeout(timer)
    timer = setTimeout(flush, delayMs)
  }

  const discard = () => {
    clearTimeout(timer)
    pending = null
  }

  return { push, flush, discard, isIdle: () => pending === null && inFlight === null }
}

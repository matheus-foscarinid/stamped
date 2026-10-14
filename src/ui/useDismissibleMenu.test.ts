import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import { stubDocument } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useDismissibleMenu } from './useDismissibleMenu.ts'

const mountMenu = () => {
  const page = stubDocument()
  const root = shallowRef(page.menuRoot as unknown as HTMLElement)
  const trigger = shallowRef<HTMLButtonElement | null>(null)
  const { result } = mountComposable(() => useDismissibleMenu({ root, trigger }))
  return { ...page, menu: result }
}

const openMenu = async () => {
  const page = mountMenu()
  page.menu.toggle()
  await nextTick()
  return page
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('while the menu is open', () => {
  it('closes on a press outside and keeps that press from reaching the map', async () => {
    const { menu, pressOutside } = await openMenu()
    const { stopPropagation } = pressOutside()
    expect(menu.isOpen.value).toBe(false)
    expect(stopPropagation).toHaveBeenCalled()
  })

  it('lets presses inside the menu through', async () => {
    const { menu, pressInside } = await openMenu()
    const { stopPropagation } = pressInside()
    expect(menu.isOpen.value).toBe(true)
    expect(stopPropagation).not.toHaveBeenCalled()
  })
})

describe('after the menu closes', () => {
  it('leaves presses on the map alone', async () => {
    const { menu, pressOutside } = await openMenu()
    menu.toggle()
    await nextTick()
    expect(pressOutside().stopPropagation).not.toHaveBeenCalled()
  })
})

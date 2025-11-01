const observeAttribute = (
  targetOrSelector: Element | string | null,
  attributeName: string,
  onChange: (value: string | null, oldValue?: string | null) => void
) => {
  const resolveTarget = (): Element | null =>
    typeof targetOrSelector === 'string'
      ? document.querySelector(targetOrSelector)
      : targetOrSelector

  const target = resolveTarget()
  if (!target) {
    document.addEventListener(
      'DOMContentLoaded',
      () => observeAttribute(targetOrSelector, attributeName, onChange),
      { once: true }
    )
    return
  }

  const initial = (target as Element).getAttribute(attributeName)
  onChange(initial, null)

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations)
      if (m.type === 'attributes' && m.attributeName === attributeName) {
        const oldVal = m.oldValue ?? null
        const newVal = (m.target as Element).getAttribute(attributeName)
        onChange(newVal, oldVal)
      }
  })

  observer.observe(target, {
    attributes: true,
    attributeFilter: [attributeName],
    attributeOldValue: true,
  })

  const win = window as unknown as {
    __attributeObservers?: MutationObserver[]
  }
  win.__attributeObservers = win.__attributeObservers || []
  win.__attributeObservers.push(observer)
  window.addEventListener('beforeunload', () => observer.disconnect())
  return observer
}

export default observeAttribute

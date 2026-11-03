export function makeEl(tag, opts = {}) {
  const el = document.createElement(tag)
  if (opts.class) el.className = opts.class
  if (opts.text != null) el.textContent = opts.text
  if (opts.html != null) el.innerHTML = opts.html
  if (opts.id) el.id = opts.id
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) {
      if (v != null) el.setAttribute(k, v)
    }
  }
  if (opts.on) {
    for (const [evt, fn] of Object.entries(opts.on)) {
      el.addEventListener(evt, fn)
    }
  }
  return el
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild)
}

export function toolBtn(text, title, onClick) {
  const b = makeEl('button', { text, attrs: { type: 'button', title } })
  b.addEventListener('click', onClick)
  return b
}
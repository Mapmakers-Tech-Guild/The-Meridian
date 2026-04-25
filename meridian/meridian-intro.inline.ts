import { getFullSlug } from "../quartz/util/path"

const SEEN = "meridianIntroSeen"
const DURATION = 2400

function initMeridian() {
  const el = document.getElementById("meridian-intro")
  if (!el) return
  if (getFullSlug(window) !== "index") {
    el.classList.add("meridian-intro--done")
    document.body.classList.add("meridian-reveal")
    return
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finish()
    return
  }
  if (sessionStorage.getItem(SEEN)) {
    finish()
    return
  }
  if (el.dataset.meridianLoading === "1") return
  const topologyUrl = (el as HTMLElement).dataset.topology
  if (!topologyUrl) {
    finish()
    return
  }
  ;(el as HTMLElement).dataset.meridianLoading = "1"
  const stage = document.getElementById("meridian-intro-stage")
  if (!stage) {
    finish()
    return
  }
  void fetch(new URL(topologyUrl, window.location.href).toString(), { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status))
      return r.json() as Promise<{
        w: number
        h: number
        bg: string
        stroke: string
        lines: { x1: number; y1: number; x2: number; y2: number; delay: number; L: number }[]
      }>
    })
    .then((topo) => {
      const ns = "http://www.w3.org/2000/svg"
      const svg = document.createElementNS(ns, "svg")
      svg.setAttribute("viewBox", `0 0 ${topo.w} ${topo.h}`)
      svg.setAttribute("width", String(Math.round(topo.w)))
      svg.setAttribute("height", String(Math.round(topo.h)))
      const rect = document.createElementNS(ns, "rect")
      rect.setAttribute("width", "100%")
      rect.setAttribute("height", "100%")
      rect.setAttribute("fill", topo.bg)
      svg.appendChild(rect)
      for (const L of topo.lines) {
        const line = document.createElementNS(ns, "line")
        line.setAttribute("class", "meridian-line")
        line.setAttribute("x1", String(L.x1))
        line.setAttribute("y1", String(L.y1))
        line.setAttribute("x2", String(L.x2))
        line.setAttribute("y2", String(L.y2))
        line.setAttribute("stroke", topo.stroke)
        line.setAttribute("stroke-width", "1.2")
        const dash = Math.ceil(L.L)
        const styleStr = `stroke-dasharray: ${dash}; stroke-dashoffset: ${dash}${L.delay != null ? `; animation-delay: ${L.delay}s` : ""}`
        line.setAttribute("style", styleStr)
        svg.appendChild(line)
      }
      stage.appendChild(svg)
      const t = window.setTimeout(finish, DURATION)
      const onClick = () => {
        window.clearTimeout(t)
        finish()
      }
      el.addEventListener("click", onClick, { once: true })
      window.addCleanup?.(() => {
        window.clearTimeout(t)
        el.removeEventListener("click", onClick)
      })
    })
    .catch(() => finish())
    .finally(() => {
      ;(el as HTMLElement).dataset.meridianLoading = "0"
    })

  function finish() {
    el.classList.add("meridian-intro--done")
    document.body.classList.add("meridian-reveal")
    sessionStorage.setItem(SEEN, "1")
  }
}

document.addEventListener("nav", initMeridian)
initMeridian()

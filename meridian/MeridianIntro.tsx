import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../quartz/components/types"
import { pathToRoot } from "../quartz/util/path"
import style from "./meridian-intro.scss"
// @ts-ignore
import script from "./meridian-intro.inline"

export default (() => {
  const MeridianIntro: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const rel = pathToRoot(fileData.slug!) + "/meridian-assets/meridian-topology.json"
    return (
      <div id="meridian-intro" class="meridian-intro" data-topology={rel} aria-label="The Meridian — vault map">
        <div class="meridian-intro__hatch" />
        <div class="meridian-intro__inner">
          <p class="meridian-intro__kicker">The Meridian</p>
          <p class="meridian-intro__meta">Edges trace the living map — from housekeeping out to the seven areas, membranes, and the links you add between them.</p>
          <div class="meridian-intro__stage" id="meridian-intro-stage" />
          <p class="meridian-intro__hint">Click to enter · or wait</p>
        </div>
      </div>
    )
  }
  MeridianIntro.css = style
  MeridianIntro.afterDOMLoaded = script
  return MeridianIntro
}) satisfies QuartzComponentConstructor

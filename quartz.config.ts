import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: "The Meridian",
    pageTitleSuffix: " · Mapmakers",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    baseUrl: "mapmakers-tech-guild.github.io/The-Meridian",
    ignorePatterns: [
      "node_modules",
      "quartz",
      "meridian",
      "scripts",
      "public",
      ".quartz-cache",
      ".github",
      "package.json",
      "package-lock.json",
      "README.md",
      "assets",
      "globals.d.ts",
      "tsconfig.json",
      "**/Templates/**",
    ],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Instrument Serif",
        body: "Source Sans 3",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#f4f0e6",
          lightgray: "#e2dccf",
          gray: "#8a9a8e",
          darkgray: "#3a433d",
          dark: "#1a211c",
          secondary: "#3d5a4a",
          tertiary: "#6b8f7a",
          highlight: "rgba(100, 130, 110, 0.18)",
          textHighlight: "rgba(200, 180, 100, 0.35)",
        },
        darkMode: {
          light: "#0a0c0b",
          lightgray: "#1c221e",
          gray: "#6a756e",
          darkgray: "#c4d0c8",
          dark: "#e6ebe7",
          secondary: "#7a9e8a",
          tertiary: "#6b7f72",
          highlight: "rgba(120, 150, 130, 0.15)",
          textHighlight: "rgba(200, 180, 90, 0.25)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: { light: "github-light", dark: "github-dark" },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config

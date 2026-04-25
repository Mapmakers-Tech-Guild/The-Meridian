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
        header: "Playfair Display",
        body: "Lora",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#f6ece0",
          lightgray: "#e5d4bb",
          gray: "#9e8c72",
          darkgray: "#4d3e2c",
          dark: "#241a0c",
          secondary: "#4a6741",
          tertiary: "#a67c45",
          highlight: "rgba(166, 124, 69, 0.15)",
          textHighlight: "rgba(190, 148, 48, 0.38)",
        },
        darkMode: {
          light: "#0d1219",
          lightgray: "#192334",
          gray: "#5c7082",
          darkgray: "#a4b8c8",
          dark: "#ddeaf4",
          secondary: "#5c8a6e",
          tertiary: "#c8a45a",
          highlight: "rgba(88, 138, 210, 0.14)",
          textHighlight: "rgba(200, 164, 90, 0.28)",
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

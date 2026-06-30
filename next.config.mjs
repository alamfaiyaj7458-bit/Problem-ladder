/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),

  // These packages are ESM-only ("type": "module") and must be transpiled.
  // Without this, Next.js cannot import them and the component silently fails,
  // rendering raw Markdown+LaTeX text instead of typeset mathematics.
  transpilePackages: [
    "react-markdown",
    "remark-math",
    "remark-gfm",
    "rehype-katex",
    "rehype-stringify",
    "remark-parse",
    "remark-rehype",
    "unified",
    "bail",
    "is-plain-obj",
    "trough",
    "vfile",
    "vfile-message",
    "unist-util-stringify-position",
    "mdast-util-from-markdown",
    "mdast-util-to-hast",
    "mdast-util-math",
    "micromark",
    "micromark-extension-math",
    "micromark-util-combine-extensions",
    "hast-util-to-jsx-runtime",
    "hast-util-raw",
    "hast-util-sanitize",
    "property-information",
    "space-separated-tokens",
    "comma-separated-tokens",
    "web-namespaces",
    "zwitch",
    "html-void-elements",
    "ccount",
    "decode-named-character-reference",
    "character-entities"
  ],

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

export default nextConfig;
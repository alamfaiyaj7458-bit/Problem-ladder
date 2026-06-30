// Allow CSS side-effect imports (globals.css, katex/dist/katex.min.css, etc.)
declare module "*.css";

// KaTeX type declarations (in case @types/katex is not installed)
declare module "katex" {
  interface KatexOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
    strict?: boolean | string | Function;
    trust?: boolean | Function;
    macros?: Record<string, string>;
    output?: "html" | "mathml" | "htmlAndMathml";
  }
  function renderToString(expression: string, options?: KatexOptions): string;
  function render(expression: string, element: HTMLElement, options?: KatexOptions): void;
  const katex: { renderToString: typeof renderToString; render: typeof render };
  export default katex;
  export { renderToString, render };
}
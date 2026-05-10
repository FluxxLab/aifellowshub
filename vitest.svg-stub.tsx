import * as React from "react";

/**
 * Test-only stub for `*.svg` imports.
 *
 * Production webpack uses `@svgr/webpack` (next.config.mjs) to convert
 * each SVG into a React component. Vitest doesn't run that loader, so
 * we alias every `*.svg` import to this no-op component instead. The
 * tests don't care what the icon looks like — they care about layout,
 * a11y, and event wiring — so a `<svg>` shell with the spread props is
 * enough.
 */
const SvgStub = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  function SvgStub(props, ref) {
    return <svg ref={ref} data-testid="svg-stub" aria-hidden {...props} />;
  },
);

export default SvgStub;

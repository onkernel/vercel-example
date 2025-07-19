import React from "react";

interface TvFrameProps {
  borderImage: string; // URL for the border image
  borderWidth?: number; // Thickness of the frame in px
  children?: React.ReactNode;
}

// We use forwardRef so that parent components (e.g., Assistant) can measure the
// dimensions of the rendered inner content div via ResizeObserver.
export const TvFrame = React.forwardRef<HTMLDivElement, TvFrameProps>(
  ({ borderImage, borderWidth = 16, children }, ref) => {
    return (
      <div className="flex justify-center items-center w-full h-full bg-stone-800 rounded-md">
        <div
          className="w-full h-full box-border border-solid flex items-center justify-center bg-black rounded-md"
          style={{
            borderWidth: borderWidth,
            borderImage: `url(${borderImage}) 30 round`,
          }}
        >
          {/* The `ref` is attached to the innermost div so consumers can measure it. */}
          <div ref={ref} className="w-full h-full bg-white shadow-lg">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

// ForwardRef components should set a display name for better DevTools debugging.
TvFrame.displayName = "TvFrame";

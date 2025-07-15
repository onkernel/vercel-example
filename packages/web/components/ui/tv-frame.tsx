import React from "react";

interface TvFrameProps {
  borderImage: string; // URL for the border image
  borderWidth?: number; // Thickness of the frame in px
  children?: React.ReactNode;
}

export const TvFrame: React.FC<TvFrameProps> = ({
  borderImage,
  borderWidth = 16,
  children,
}) => {
  return (
    <div className="flex justify-center items-center w-full h-full bg-stone-800 rounded-md">
      <div
        className="w-full h-full box-border border-solid flex items-center justify-center bg-black rounded-md"
        style={{
          borderWidth: borderWidth,
          borderImage: `url(${borderImage}) 30 round`,
        }}
      >
        <div className="w-full h-full bg-white shadow-lg">{children}</div>
      </div>
    </div>
  );
};

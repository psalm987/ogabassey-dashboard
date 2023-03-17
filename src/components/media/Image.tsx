import React from "react";
import NextImage, { ImageProps } from "next/image";
import { Box, BoxProps } from "@mui/material";

type CustomImageProps = {
  height: BoxProps["height"];
  width?: BoxProps["width"];
  sx?: BoxProps["sx"];
  src: string;
  alt: string;
};

const CustomImage = (props: CustomImageProps) => {
  return (
    <Box
      sx={{
        position: "relative",
        height: props.height,
        width: props.width,
        ...props.sx,
      }}
    >
      <NextImage src={props.src} layout="fill" alt={props.alt} />
    </Box>
  );
};

export default CustomImage;

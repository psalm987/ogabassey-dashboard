import React from "react";
import Typography from "@mui/material/Typography";
import { TypographyProps } from "@mui/material";

interface HighlightProps extends TypographyProps {
  primary?: boolean;
  secondary?: boolean;
  bold?: boolean;
  semiBold?: boolean;
  underline?: boolean;
}

const Highlight = (props: HighlightProps) => {
  const {
    primary,
    secondary,
    bold,
    semiBold,
    underline,
    children,
    sx,
    ...rest
  } = props;
  return (
    <Typography
      {...rest}
      component="span"
      variant="inherit"
      sx={{
        fontWeight: bold ? 700 : semiBold ? 600 : undefined,
        color: primary
          ? "primary.main"
          : secondary
          ? "secondary.main"
          : undefined,
        textDecoration: underline ? "underline" : undefined,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
};

export default Highlight;

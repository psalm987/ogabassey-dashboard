import { getFontWeightValue, pxToRem } from "@theme/constants";
import { Typography, TypographyProps } from "@mui/material";
import React from "react";

const H2 = (props: TypographyProps) => {
  const { sx, children, fontWeight, ...rest } = props;
  const CustomComponent: React.FC = (props) => <h2 {...props} />;
  return (
    <Typography
      {...rest}
      component={CustomComponent}
      sx={{
        fontWeight: getFontWeightValue(fontWeight),
        fontSize: {
          md: pxToRem(40),
          xs: pxToRem(24),
        },
        lineHeight: {
          md: pxToRem(48),
          xs: pxToRem(36),
        },
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
};

export default H2;

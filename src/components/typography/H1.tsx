import { getFontWeightValue, pxToRem } from "@theme/constants";
import { Typography, TypographyProps } from "@mui/material";
import React from "react";

const H1 = (props: TypographyProps) => {
  const { sx, children, fontWeight, ...rest } = props;
  const CustomComponent: React.FC = (props) => <h1 {...props} />;
  return (
    <Typography
      {...rest}
      component={CustomComponent}
      sx={{
        fontWeight: getFontWeightValue(fontWeight),
        fontSize: {
          md: pxToRem(56),
          xs: pxToRem(32),
        },
        lineHeight: {
          md: pxToRem(72),
          xs: pxToRem(40),
        },
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
};

export default H1;

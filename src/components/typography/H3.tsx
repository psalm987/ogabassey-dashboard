import { getFontWeightValue, pxToRem } from "@theme/constants";
import { Typography, TypographyProps } from "@mui/material";
import React from "react";

const H3 = (props: TypographyProps) => {
  const { sx, children, fontWeight, ...rest } = props;
  const CustomComponent: React.FC = (props) => <h3 {...props} />;
  return (
    <Typography
      {...rest}
      component={CustomComponent}
      sx={{
        fontWeight: getFontWeightValue(fontWeight),
        fontSize: {
          md: pxToRem(24),
          xs: pxToRem(20),
        },
        lineHeight: {
          md: pxToRem(36),
          xs: pxToRem(22),
        },
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
};

export default H3;

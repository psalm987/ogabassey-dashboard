import { getFontWeightValue, pxToRem } from "@theme/constants";
import { Typography, TypographyProps } from "@mui/material";
import React from "react";

const Text = (props: TypographyProps) => {
  const { sx, children, fontWeight, ...rest } = props;
  const CustomComponent: React.FC = (props) => <p {...props} />;
  return (
    <Typography
      {...rest}
      component={CustomComponent}
      sx={{
        fontWeight: getFontWeightValue(fontWeight),
        fontSize: pxToRem(16),
        lineHeight: pxToRem(24),
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
};

export default Text;

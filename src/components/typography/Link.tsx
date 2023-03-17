import React from "react";
import NextLink from "next/link";
import MuiLink, { LinkProps } from "@mui/material/Link";

const Link = (props: LinkProps) => {
  const Holder = props.href !== undefined ? NextLink : React.Fragment;
  return (
    <Holder href={props.href || ""} passHref>
      <MuiLink
        sx={{
          textDecoration: "none",
          cursor: "pointer",
          color: "primary.main",
          "&:hover": {
            color: "text.primary",
          },
          ...props.sx,
        }}
      >
        {props.children}
      </MuiLink>
    </Holder>
  );
};

export default Link;

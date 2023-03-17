import React from "react";
import Container from "@mui/material/Container";
import {
  AppBar as MuiAppBar,
  Toolbar,
  useTheme,
  InputBase,
  Box,
  InputBaseProps,
} from "@mui/material";
import Image from "@components/media/Image";
import { styled, alpha } from "@mui/material/styles";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

const AppBar = ({
  searchProps,
}: {
  searchProps: { value: string; onChange: InputBaseProps["onChange"] };
}) => {
  const theme = useTheme();
  return (
    <>
      <MuiAppBar position="fixed" color="secondary">
        <Toolbar
          sx={{
            width: "100%",
            maxWidth: theme.breakpoints.values.md,
            mx: "auto",
          }}
        >
          <Image
            src="/images/svg/logo_white.svg"
            alt="logo"
            height="40px"
            width="150px"
          />
          <Box flexGrow={1} />
          <Search>
            <SearchIconWrapper>
              <SearchRoundedIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ "aria-label": "search" }}
              {...searchProps}
            />
          </Search>
        </Toolbar>
      </MuiAppBar>
      <Toolbar />
    </>
  );
};

export default AppBar;

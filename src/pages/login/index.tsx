import type { NextPage } from "next";
import { Box, TextField, Button } from "@mui/material";
import { getBackground } from "@theme/constants";
import Caption from "@components/typography/Caption";
import Text from "@components/typography/Text";
import H1 from "@components/typography/H1";
import Link from "@components/typography/Link";

const Login: NextPage = () => {
  return (
    <Box
      height="max(100vh, 500px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "repeat",
        backgroundImage: getBackground(1),
      }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          width: "min(100%,500px)",
          px: { xs: 3, md: 5 },
          py: { xs: 6, md: 8 },
          mx: 1,
          my: 4,
          borderRadius: { xs: 4, md: 8 },
          display: "flex",
          flexDirection: "column",
          gap: 2,
          boxShadow:
            "-2px 33px 41px 0px rgba(124,129,222,0.25);webkit-box-shadow: -2px 33px 41px 0px rgba(124,129,222,0.25);-moz-box-shadow: -2px 33px 41px 0px rgba(124,129,222,0.25);",
        }}
      >
        <Box>
          <H1 color="textPrimary" textAlign="center" gutterBottom>
            Welcome
          </H1>
          <Text
            color="textSecondary"
            textAlign="center"
            sx={{ maxWidth: "300px", mx: "auto" }}
            gutterBottom
          >
            Hey there! Enter your details to get signed into your account
          </Text>
        </Box>
        <TextField
          id="email"
          label="Email"
          variant="outlined"
          // value={}
          // onChange={}
        />
        <TextField
          id="password"
          label="Password"
          variant="outlined"
          type="password"
          // value={}
          // onChange={}
        />
        <Caption
          sx={{
            alignSelf: "flex-end",
          }}
        >
          <Link href="/">Having trouble signing in?</Link>
        </Caption>
        <Button
          variant="contained"
          color="primary"
          size="large"
          // sx={{ alignSelf: "flex-start" }}
        >
          Sign in
        </Button>
      </Box>
    </Box>
  );
};

export default Login;

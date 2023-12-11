import "../styles/globals.css";
import type { AppProps } from "next/app";
import ThemeWrapper from "@theme/ThemeWrapper";
import CssBaseline from "@mui/material/CssBaseline";
import { Provider } from "react-redux";
import store from "@store/index";
import { GlobalStyles } from "@mui/material";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

const client = new ApolloClient({
  uri:
    process.env.NEXT_PUBLIC_GRAPHQL_URI ||
    `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/graphql`,
  cache: new InMemoryCache(),
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <Provider store={store}>
        <ThemeWrapper>
          <CssBaseline />
          <GlobalStyles
            styles={{
              body: {
                overscrollBehavior: "none",
              },
            }}
          />
          <Component {...pageProps} />
        </ThemeWrapper>
      </Provider>
    </ApolloProvider>
  );
}

export default MyApp;

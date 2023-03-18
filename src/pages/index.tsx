import type { NextPage } from "next";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import H1 from "@components/typography/H1";
import { Avatar, Box, GlobalStyles, Grid, Typography } from "@mui/material";
import Text from "@components/typography/Text";
import Image from "@components/media/Image";
import AppBar from "@components/surface/AppBar";
import React from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_ALL_PRODUCTS,
  REPLACE_PRODUCTS,
  SEARCH_PRODUCTS,
} from "src/apollo/schemas";
import DisplayGrid from "@components/product/DisplayGrid";
import Papa from "papaparse";
import { FormatCSV } from "src/util/formatCSV";
import Script from "next/script";
import { orange } from "@mui/material/colors";

interface ReplaceProductsMutation {}
interface ReplaceProductsMutationVariables {
  data: ProductProps[];
}

const Home: NextPage = () => {
  const [productsDisplay, setProductDisplay] = React.useState<ProductProps[]>(
    []
  );
  const [loading, setLoading] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const [csvFile, setCSVFile] = React.useState<File | undefined>();

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    loading: allProductsLoading,
    error: allProductsError,
    data: allProductsData,
    refetch: refetchAllProducts,
  } = useQuery(GET_ALL_PRODUCTS);

  const {
    loading: searchProductsLoading,
    error: searchProductsError,
    data: searchProductsData,
    refetch: refetchAllSearch,
  } = useQuery(SEARCH_PRODUCTS, { variables: { query: searchQuery } });

  const [
    replaceProducts,
    {
      loading: replaceProductsLoading,
      error: replaceProductsError,
      data: replaceProductsData,
    },
  ] = useMutation<ReplaceProductsMutation, ReplaceProductsMutationVariables>(
    REPLACE_PRODUCTS,
    {
      onCompleted: async () => {
        searchQuery && (await refetchAllSearch());
        await refetchAllProducts();
      },
    }
  );

  const handleFileChange = (e: React.FormEvent<HTMLInputElement>) => {
    Papa.parse(e.currentTarget?.files?.[0]!, {
      dynamicTyping: true,
      complete: (results: any) => {
        const formatedJSON = FormatCSV(results.data!)!;
        replaceProducts({
          variables: { data: formatedJSON },
        });
      },
    });
  };

  React.useEffect(() => {
    searchQuery
      ? setProductDisplay(searchProductsData?.searchProduct)
      : setProductDisplay(allProductsData?.getProducts);
  }, [searchQuery, allProductsData, searchProductsData]);

  // console.log(GET_ALL_PRODUCTS, allProductsData, searchProductsData, "DATA...");

  return (
    <>
      <AppBar
        searchProps={{
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.currentTarget.value),
        }}
      />
      <Container maxWidth="md" sx={{ overscrollBehavior: "auto" }}>
        <Grid container spacing={2} sx={{ mt: 6 }}>
          <Grid item xs={12} md={6}>
            <Box>
              <H1 fontWeight="bold" gutterBottom>
                Dashboard
              </H1>
              <Text
                color="text.secondary"
                sx={{ maxWidth: 500, mb: 4 }}
                gutterBottom
              >
                Here you can view all products available, as well as populate
                and make updates to the stock.
              </Text>
              <Button
                variant="contained"
                color="primary"
                onClick={() => inputRef.current?.click?.()}
              >
                Upload CSV
              </Button>
              <Box display="none">
                <input
                  type="file"
                  ref={inputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                />
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Image
              height={{ xs: 300, sm: 500, md: 250 }}
              src="/images/svg/admin_image.svg"
              alt="Illustration"
            />
          </Grid>
        </Grid>
        <DisplayGrid
          products={productsDisplay || []}
          loading={
            allProductsLoading || (!!searchQuery && searchProductsLoading)
          }
        />
      </Container>
      <GlobalStyles
        styles={{
          "df-messenger": {
            "--df-messenger-bot-message": orange[100],
            "--df-messenger-button-titlebar-color": orange[900],
          },
        }}
      />
      <Script
        id="dialogflow"
        src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"
      ></Script>
      {/* @ts-ignore */}
      <df-messenger
        intent="WELCOME"
        chat-title="Ogabassey"
        agent-id="4ac40644-8cb0-49c7-b7ee-edb35952eb50"
        language-code="en"
        wait-open="true"
      />
    </>
  );
};

export default Home;

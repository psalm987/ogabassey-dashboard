import React from "react";
import { Grid } from "@mui/material";
import Card from "@components/product/Card";

const DisplayGrid = ({
  products,
  loading,
}: {
  products: ProductProps[];
  loading?: boolean;
}) => {
  return (
    <Grid container spacing={4} rowSpacing={8} mt={4}>
      {(loading ? new Array(4).fill(2) : products).map((product, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card loading={loading} product={product} />
        </Grid>
      ))}
    </Grid>
  );
};

export default DisplayGrid;

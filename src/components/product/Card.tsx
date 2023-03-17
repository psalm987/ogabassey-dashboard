import React from "react";
import { Avatar, Box, Skeleton, Typography } from "@mui/material";
import { LaptopMacRounded, PhoneIphoneRounded } from "@mui/icons-material";
import Image from "@components/media/Image";
import formatNaira from "src/util/formatNaira";

const getAvatar = (type?: string) => {
  const style = { color: "secondary.main", bgcolor: "secondary.light" };
  switch (type?.toLowerCase()) {
    case "laptop":
      return (
        <Avatar sx={style}>
          <LaptopMacRounded />
        </Avatar>
      );
    case "phone":
      return (
        <Avatar sx={style}>
          <PhoneIphoneRounded />
        </Avatar>
      );
    default:
      return "";
  }
};

const Card: React.FC<{ product: ProductProps; loading?: boolean }> = ({
  product,
  loading,
}: {
  product: ProductProps;
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <React.Fragment>
        <Skeleton
          width="100%"
          height="200px"
          sx={{ borderRadius: 4, transform: "none" }}
        />
        <Box mt={1} display="flex" alignItems="center">
          <Box flexGrow={1}>
            <Skeleton
              width={100}
              height="14px"
              sx={{ transform: "scaleY(0.8)" }}
            />
            <Skeleton
              width={150}
              height="32px"
              sx={{ transform: "scaleY(0.8)", mt: 1 }}
            />
          </Box>
          <Skeleton height={40} width={40} variant="circular" />
        </Box>
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <Image
        src={product.imageUrl!}
        // "https://images.pexels.com/photos/1482061/pexels-photo-1482061.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        alt="Product"
        height="200px"
        sx={{
          "& *": {
            objectFit: "cover",
          },
          borderRadius: 4,
          overflow: "hidden",
          border: "0.5px solid lightgray",
        }}
      />
      <Box mt={1} display="flex" alignItems="center" gap={1} overflow="hidden">
        <Box flexGrow={1} width={0} overflow="hidden">
          <Typography
            variant="caption"
            color="textSecondary"
            gutterBottom
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: "100%",
              wordBreak: "break-word",
              hyphens: "auto",
            }}
          >
            {product.name}
          </Typography>
          <Typography variant="h6" color="textPrimary" fontFamily="Poppins">
            {formatNaira(product.price)}
          </Typography>
        </Box>
        <Box>{getAvatar(product.type)}</Box>
      </Box>
    </React.Fragment>
  );
};

export default Card;

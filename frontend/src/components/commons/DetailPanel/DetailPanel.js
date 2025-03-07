import { Card, CardContent, Grid, Typography, Skeleton } from "@mui/material";
import CurrencyBox from "../CurrencyBox/CurrencyBox";

const DetailPanel = ({ expense }) => {
  if (!expense) {
    return (
      <Card sx={{ p: 2, width: "100%" }}>
        <CardContent>
          <Skeleton variant="rectangular" width="100%" height={100} />
        </CardContent>
      </Card>
    );
  }

  const {
    shopName,
    volume,
    registeredDate,
    purchaseDate,
    finalPrice,
    type,
    brandName,
    locationName,
    price,
    discountAmount,
    discountValue,
  } = expense;

  return (
    <Card sx={{ p: 2, width: "100%" }}>
      <CardContent>
        <Grid container spacing={2}>
          {/* Column 1: Shop, Brand, Location */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Butikk Informasjon
            </Typography>
            <Typography variant="body1"><b>Butikk:</b> {shopName || "Ikke tilgjengelig"}</Typography>
            <Typography variant="body1"><b>Merke:</b> {brandName || "Ukjent"}</Typography>
            <Typography variant="body1"><b>Sted:</b> {locationName || "Ikke oppgitt"}</Typography>
          </Grid>

          {/* Column 2: Prices and Discounts */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Priser og Rabatter
            </Typography>
            <Typography variant="body1"><b>Pris:</b> <CurrencyBox value={price} /></Typography>
            {discountAmount > 0 && (
              <>
                <Typography variant="body1"><b>Rabatt i kr:</b> <CurrencyBox value={discountAmount} /></Typography>
                <Typography variant="body1"><b>Rabatt i %:</b> {discountValue} %</Typography>
              </>
            )}
            {finalPrice !== price && (
              <Typography variant="body1"><b>Pris etter rabatt:</b> <CurrencyBox value={finalPrice} /></Typography>
            )}
          </Grid>

          {/* Column 3: Type, Volume, Dates */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Detaljer
            </Typography>
            <Typography variant="body1"><b>Type:</b> {type || "Ikke spesifisert"}</Typography>
            <Typography variant="body1"><b>Volum:</b> {volume || "N/A"}</Typography>
            <Typography variant="body1"><b>Kjøpt Dato:</b> {purchaseDate || "Ikke oppgitt"}</Typography>
            <Typography variant="body1"><b>Registrert Dato:</b> {registeredDate || "Ikke registrert"}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export { DetailPanel };

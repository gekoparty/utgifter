import { Card, CardContent, Grid, Typography, CircularProgress} from "@mui/material";
import CurrencyBox from "../CurrencyBox/CurrencyBox";

const DetailPanel = ({ expense }) => {
  // If no expense is passed, show a loading indicator (or you can handle it as needed)
  if (!expense) return <CircularProgress />;

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
            {shopName && <div><b>Butikk:</b> {shopName}</div>}
            {brandName && <div><b>Merke:</b> {brandName}</div>}
            {locationName && <div><b>Sted:</b> {locationName}</div>}
          </Grid>

          {/* Column 2: Prices and Discounts */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Priser og Rabatter
            </Typography>
            <div>
              <b>Pris:</b> <CurrencyBox value={price} />
            </div>
            {discountAmount > 0 && (
              <>
                <div>
                  <b>Rabatt i kr:</b> <CurrencyBox value={discountAmount} />
                </div>
                <div>
                  <b>Rabatt i %:</b> {discountValue} %
                </div>
              </>
            )}
            {finalPrice !== price && (
              <div>
                <b>Pris etter rabatt:</b> <CurrencyBox value={finalPrice} />
              </div>
            )}
          </Grid>

          {/* Column 3: Type, Volume, Dates */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Detaljer
            </Typography>
            {type && <div><b>Type:</b> {type}</div>}
            {volume && <div><b>Volum:</b> {volume}</div>}
            {purchaseDate && <div><b>Kjøpt Dato:</b> {purchaseDate}</div>}
            {registeredDate && <div><b>Registrert Dato:</b> {registeredDate}</div>}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export { DetailPanel };

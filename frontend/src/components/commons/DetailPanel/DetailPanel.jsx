import {
  Box,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CurrencyBox from "../CurrencyBox/CurrencyBox";

const formatVolume = (volume, unit) => {
  const value = Number(volume);
  if (!Number.isFinite(value) || value <= 0) return "Ikke satt";
  return `${new Intl.NumberFormat("nb-NO").format(value)} ${unit || ""}`.trim();
};

const getTextValue = (value) => {
  if (typeof value === "string") return value.trim();
  if (value?.name) return String(value.name).trim();
  if (value?.label) return String(value.label).trim();
  return "";
};

const InfoLine = ({ label, value, strong = false }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "minmax(72px, 0.8fr) minmax(0, 1.2fr)",
      gap: 1,
      alignItems: "baseline",
      minWidth: 0,
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Box
      sx={{
        color: "text.primary",
        fontWeight: strong ? 800 : 650,
        textAlign: "left",
        minWidth: 0,
        overflowWrap: "anywhere",
      }}
    >
      {value}
    </Box>
  </Box>
);

const Section = ({ icon, title, children }) => (
  <Box
    sx={(theme) => ({
      minWidth: 0,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1.5,
      bgcolor:
        theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.035)"
          : "rgba(255,255,255,0.78)",
      p: { xs: 1.5, md: 2 },
    })}
  >
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
      <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>
        {icon}
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>
        {title}
      </Typography>
    </Stack>
    <Stack spacing={0.8}>{children}</Stack>
  </Box>
);

const DetailPanel = ({ expense }) => {
  if (!expense) {
    return (
      <Box sx={{ p: 2, width: "100%" }}>
        <Skeleton variant="rounded" width="100%" height={96} />
      </Box>
    );
  }

  const {
    shopName,
    volume,
    measurementUnit,
    registeredDate,
    registeredDateDisplay,
    purchaseDate,
    purchaseDateDisplay,
    finalPrice,
    productCategory,
    brandName,
    locationName,
    price,
    discountAmount,
    discountValue,
    variantName,
    quantity,
  } = expense;

  const hasDiscount = Number(discountAmount) > 0;
  const rawCategory =
    getTextValue(productCategory) ||
    getTextValue(expense.product?.category) ||
    getTextValue(expense.productName?.category) ||
    getTextValue(expense.category);
  const categoryLabel = rawCategory || "Ikke kategorisert";
  const hasCategory = Boolean(rawCategory);

  return (
    <Box
      sx={(theme) => ({
        position: "sticky",
        left: 0,
        zIndex: 1,
        width: {
          xs: "min(100%, calc(100vw - 72px))",
          md: "min(1040px, calc(100vw - 180px))",
        },
        maxWidth: "100%",
        boxSizing: "border-box",
        px: { xs: 1.25, md: 2 },
        py: { xs: 1.5, md: 2 },
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.primary.main, 0.08)
            : alpha(theme.palette.primary.main, 0.035),
        borderTop: "1px solid",
        borderBottom: "1px solid",
        borderColor: "divider",
      })}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              icon={<CategoryOutlinedIcon />}
              label={categoryLabel}
              size="small"
              color={hasCategory ? "primary" : "default"}
              variant={hasCategory ? "filled" : "outlined"}
              sx={{ fontWeight: 750 }}
            />
            {variantName ? (
              <Chip label={variantName} size="small" variant="outlined" />
            ) : null}
            {hasDiscount ? (
              <Chip
                label={`${discountValue || 0}% rabatt`}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 750 }}
              />
            ) : null}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {purchaseDateDisplay || purchaseDate || "Dato mangler"}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(230px, 1fr))",
            },
            gap: 1.5,
          }}
        >
          <Section icon={<StorefrontIcon fontSize="small" />} title="Butikk">
            <InfoLine label="Butikk" value={shopName || "Ikke valgt"} strong />
            <InfoLine label="Merke" value={brandName || "Ukjent"} />
            <InfoLine label="Sted" value={locationName || "Ikke oppgitt"} />
          </Section>

          <Section icon={<PaymentsOutlinedIcon fontSize="small" />} title="Pris">
            <InfoLine label="Pris" value={<CurrencyBox value={price} />} strong />
            {hasDiscount ? (
              <>
                <InfoLine
                  label="Rabatt"
                  value={<CurrencyBox value={discountAmount} />}
                />
                <InfoLine label="Rabattprosent" value={`${discountValue || 0}%`} />
                <Divider flexItem />
              </>
            ) : null}
            <InfoLine
              label="Sluttpris"
              value={<CurrencyBox value={finalPrice} />}
              strong
            />
          </Section>

          <Section icon={<InfoOutlinedIcon fontSize="small" />} title="Detaljer">
            <InfoLine label="Kategori" value={categoryLabel} strong />
            <InfoLine label="Volum" value={formatVolume(volume, measurementUnit)} />
            <InfoLine label="Antall" value={quantity || 1} />
            <InfoLine
              label="Registrert"
              value={registeredDateDisplay || registeredDate || "Ikke registrert"}
            />
          </Section>
        </Box>
      </Stack>
    </Box>
  );
};

export { DetailPanel };

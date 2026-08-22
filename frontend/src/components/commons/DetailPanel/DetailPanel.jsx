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
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
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
      gridTemplateColumns: { xs: "1fr", sm: "minmax(92px, 0.7fr) minmax(0, 1.3fr)" },
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

const Section = ({ icon, title, children, tone = "default" }) => (
  <Box
    sx={(theme) => ({
      minWidth: 0,
      border: "1px solid",
      borderColor:
        tone === "primary"
          ? alpha(theme.palette.primary.main, 0.28)
          : "divider",
      borderRadius: 1.5,
      bgcolor:
        tone === "primary"
          ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.1 : 0.055)
          : theme.palette.mode === "dark"
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
    pricePerUnit,
    productCategory,
    brandName,
    locationName,
    price,
    discountAmount,
    discountValue,
    variantName,
    quantity,
    purchased,
    productName,
  } = expense;

  const hasDiscount = Number(discountAmount) > 0;
  const statusLabel = purchased ? "Kjøpt" : "Registrert";
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
        width: "100%",
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
          spacing={1.25}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={950} sx={{ lineHeight: 1.2 }}>
              {productName || "Ukjent produkt"}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
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
              <Chip
                label={statusLabel}
                size="small"
                color={purchased ? "success" : "default"}
                variant={purchased ? "filled" : "outlined"}
                sx={{ fontWeight: 750 }}
              />
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
          </Box>

          <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary">
            <EventAvailableOutlinedIcon fontSize="small" />
            <Typography variant="body2">
              {purchaseDateDisplay || purchaseDate || "Dato mangler"}
            </Typography>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1fr) minmax(0, 1fr)",
            },
            gap: 1.5,
            width: "100%",
            minWidth: 0,
          }}
        >
          <Section icon={<StorefrontIcon fontSize="small" />} title="Produkt og butikk" tone="primary">
            <InfoLine label="Produkt" value={productName || "Ukjent produkt"} strong />
            <InfoLine label="Merke" value={brandName || "Ukjent"} />
            <InfoLine label="Variant" value={variantName || "Ingen variant"} />
            <Divider flexItem />
            <InfoLine label="Butikk" value={shopName || "Ikke valgt"} strong />
            <InfoLine label="Sted" value={locationName || "Ikke oppgitt"} />
            <InfoLine label="Kategori" value={categoryLabel} />
            <InfoLine label="Volum" value={formatVolume(volume, measurementUnit)} />
          </Section>

          <Section icon={<PaymentsOutlinedIcon fontSize="small" />} title="Pris og status">
            <InfoLine label="Pris" value={<CurrencyBox value={price} />} strong />
            <InfoLine
              label={`Pris per ${measurementUnit || "enhet"}`}
              value={<CurrencyBox value={pricePerUnit} />}
            />
            <InfoLine label="Antall" value={quantity || 1} />
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
            <Divider flexItem />
            <InfoLine label="Status" value={statusLabel} strong />
            <InfoLine
              label="Kjøpsdato"
              value={purchaseDateDisplay || purchaseDate || "Ikke satt"}
            />
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

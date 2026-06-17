import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { requestJson } from "../../../../../api/httpClient";
import FormSection from "../../../../../components/commons/Forms/FormSection";
import { extractReceiptTextFromFile } from "../../../utils/receiptText";

const buildProductOption = (product) => ({
  label: product?.name || "",
  value: String(product?._id ?? product?.id ?? ""),
  id: String(product?._id ?? product?.id ?? ""),
  name: product?.name || "",
  category: product?.category || "",
  measurementUnit: product?.measurementUnit || "",
  measures: Array.isArray(product?.measures) ? product.measures : [],
  variants: Array.isArray(product?.variants) ? product.variants : [],
  brands: Array.isArray(product?.brands) ? product.brands : [],
});

const buildBrandOption = (brand) => ({
  label: brand?.name || "",
  value: String(brand?._id ?? brand?.id ?? ""),
  id: String(brand?._id ?? brand?.id ?? ""),
  name: brand?.name || "",
});

const buildShopOption = (shop) => ({
  label: shop?.locationName ? `${shop.name}, ${shop.locationName}` : shop?.name || "",
  value: String(shop?._id ?? shop?.id ?? ""),
  id: String(shop?._id ?? shop?.id ?? ""),
  name: shop?.name || "",
  locationId: String(shop?.locationId || ""),
  locationName: shop?.locationName || "",
});

export default function ReceiptImportPanel({ onUseProduct, onUseBrand, onUseShop }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [brandCandidates, setBrandCandidates] = useState([]);
  const [shopCandidates, setShopCandidates] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canShowTextHint = Boolean(fileName) && !extractedText && !loading;

  const sortedCandidates = useMemo(
    () => [...candidates].sort((a, b) => Number(b.confidence) - Number(a.confidence)),
    [candidates],
  );
  const extractedPreview = useMemo(() => {
    if (!extractedText || sortedCandidates.length) return "";
    return extractedText.length > 500
      ? `${extractedText.slice(0, 500)}...`
      : extractedText;
  }, [extractedText, sortedCandidates.length]);

  const analyzeReceipt = async (file) => {
    if (!file) return;

    setLoading(true);
    setError("");
    setMessage("");
    setCandidates([]);
    setBrandCandidates([]);
    setShopCandidates([]);
    setSelectedProductId("");
    setFileName(file.name);
    setOcrProgress(null);

    try {
      const text = await extractReceiptTextFromFile(file, {
        onProgress: (progress) => setOcrProgress(progress),
      });
      setExtractedText(text);
      setOcrProgress(null);

      const response = await requestJson("/api/receipts/match-products", {
        method: "POST",
        data: {
          fileName: file.name,
          text,
        },
      });

      setCandidates(response?.candidates ?? []);
      setBrandCandidates(response?.brandCandidates ?? []);
      setShopCandidates(response?.shopCandidates ?? []);

      if (!response?.candidates?.length) {
        setMessage(
          text
            ? "Ingen sikre produktforslag funnet. Velg produkt manuelt."
            : "Fant ikke lesbar tekst i filen. Skannede PDF-er må ha tekstlag eller OCR-støtte senere.",
        );
      }
    } catch (err) {
      setError(
        err?.status === 404
          ? "OCR leste filen, men backend mangler kvitteringsruten. Start backend på nytt eller deploy siste backend."
          : err?.message || "Kunne ikke analysere filen.",
      );
    } finally {
      setLoading(false);
      setOcrProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    analyzeReceipt(file);
  };

  const rememberMatch = ({ phrase, productId, brandId, shopId }) => {
    const learningText = phrase || extractedText;
    if (!learningText) return;

    requestJson("/api/receipts/learn-match", {
      method: "POST",
      data: {
        text: learningText,
        phrase: learningText,
        productId,
        brandId,
        shopId,
      },
    }).catch(() => {});
  };

  const applyCandidate = (candidate) => {
    const option = buildProductOption(candidate.product);
    if (!option.id) return;

    onUseProduct?.(option);
    if (candidate.suggestedBrand?.id) {
      onUseBrand?.(buildBrandOption(candidate.suggestedBrand));
    }
    if (candidate.suggestedShop?.id) {
      onUseShop?.(buildShopOption(candidate.suggestedShop));
    }
    setSelectedProductId(option.id);
    rememberMatch({
      phrase: candidate.snippets?.[0] || candidate.matchedAliases?.[0]?.phrase,
      productId: option.id,
      brandId: candidate.suggestedBrand?.id,
      shopId: candidate.suggestedShop?.id,
    });
  };

  const applyBrand = (brand) => {
    const option = buildBrandOption(brand);
    if (!option.id) return;
    onUseBrand?.(option);
    rememberMatch({
      phrase: brand.snippets?.[0],
      brandId: option.id,
    });
  };

  const applyShop = (shop) => {
    const option = buildShopOption(shop);
    if (!option.id) return;
    onUseShop?.(option);
    rememberMatch({
      phrase: shop.snippets?.[0],
      shopId: option.id,
    });
  };

  return (
    <FormSection title="Finn produkt fra kvittering">
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            Last opp bilde eller PDF
          </Button>

          {fileName ? (
            <Typography variant="body2" color="text.secondary" noWrap>
              {fileName}
            </Typography>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,text/plain,.txt,.csv"
            hidden
            onChange={handleFileChange}
          />
        </Stack>

        {loading ? <LinearProgress /> : null}
        {ocrProgress ? (
          <Typography variant="caption" color="text.secondary">
            Leser bilde med OCR: {Math.round(Number(ocrProgress.progress || 0) * 100)}%
          </Typography>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="info">{message}</Alert> : null}

        {extractedPreview ? (
          <Alert severity="info">
            OCR fant tekst, men ingen sikre produktmatcher. Utdrag: {extractedPreview}
          </Alert>
        ) : null}

        {brandCandidates.length || shopCandidates.length ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Fant også dette i kvitteringen:
            </Typography>

            {shopCandidates.length ? (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {shopCandidates.slice(0, 4).map((shop) => (
                  <Chip
                    key={shop.id}
                    clickable
                    label={`Butikk: ${shop.name}`}
                    onClick={() => applyShop(shop)}
                    variant="outlined"
                  />
                ))}
              </Stack>
            ) : null}

            {brandCandidates.length ? (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {brandCandidates.slice(0, 4).map((brand) => (
                  <Chip
                    key={brand.id}
                    clickable
                    label={`Merke: ${brand.name}`}
                    onClick={() => applyBrand(brand)}
                    variant="outlined"
                  />
                ))}
              </Stack>
            ) : null}
          </Stack>
        ) : null}

        {canShowTextHint ? (
          <Alert severity="info">
            Filen ble lastet opp, men appen fant ikke tekst å lese. Produktet må
            velges manuelt.
          </Alert>
        ) : null}

        {sortedCandidates.length ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Forslag må bekreftes manuelt før de brukes i skjemaet.
            </Typography>

            {sortedCandidates.map((candidate) => {
              const product = candidate.product;
              const productId = String(product?._id ?? product?.id ?? "");
              const selected = selectedProductId === productId;

              return (
                <Paper
                  key={productId}
                  variant="outlined"
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: selected
                      ? "rgba(59,130,246,0.13)"
                      : "rgba(255,255,255,0.035)",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.25}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Typography fontWeight={900}>{product?.name}</Typography>
                        <Chip
                          size="small"
                          label={`${candidate.confidence}% match`}
                          color={candidate.confidence >= 75 ? "success" : "default"}
                        />
                        {product?.category ? (
                          <Chip size="small" variant="outlined" label={product.category} />
                        ) : null}
                        {candidate.suggestedBrand?.name ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Merke: ${candidate.suggestedBrand.name}`}
                          />
                        ) : null}
                        {candidate.suggestedShop?.name ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Butikk: ${candidate.suggestedShop.name}`}
                          />
                        ) : null}
                      </Stack>

                      {product?.brandNames?.length ? (
                        <Typography variant="caption" color="text.secondary">
                          Merker: {product.brandNames.join(", ")}
                        </Typography>
                      ) : null}

                      {candidate.snippets?.length ? (
                        <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                          <Typography variant="caption" color="text.secondary">
                            Sammenlignet med:
                          </Typography>
                          {candidate.snippets.slice(0, 2).map((snippet) => (
                            <Typography
                              key={snippet}
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              {snippet}
                            </Typography>
                          ))}
                        </Stack>
                      ) : null}

                      {candidate.matchedTokens?.length ? (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          useFlexGap
                          flexWrap="wrap"
                          sx={{ mt: 0.75 }}
                        >
                          {candidate.matchedTokens.slice(0, 8).map((token) => (
                            <Chip
                              key={token}
                              size="small"
                              variant="outlined"
                              label={token}
                            />
                          ))}
                        </Stack>
                      ) : null}

                      {candidate.reasons?.length ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.5 }}
                        >
                          Grunnlag: {candidate.reasons.join(", ")}
                        </Typography>
                      ) : null}
                    </Box>

                    <Button
                      variant={selected ? "contained" : "outlined"}
                      startIcon={selected ? <CheckCircleOutlineIcon /> : null}
                      onClick={() => applyCandidate(candidate)}
                      sx={{ textTransform: "none", fontWeight: 800 }}
                    >
                      {selected ? "Valgt" : "Bruk produkt"}
                    </Button>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        ) : null}
      </Stack>
    </FormSection>
  );
}

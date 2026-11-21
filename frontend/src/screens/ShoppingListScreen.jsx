import React, { useEffect, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { alpha } from "@mui/material/styles";
import PageLayout from "../components/commons/Layout/PageLayout";
import { buildApiUrl, requestJson } from "../api/httpClient";
import useInfiniteProducts from "../hooks/useInfiniteProducts";
import { useTranslation } from "../i18n/useTranslation";
import { useAuth } from "../auth/useAuth";

const loadRecommendation = ({ productId, brandId, variantId }, signal) => {
  const url = buildApiUrl(`/api/expenses/shopping-recommendation/${productId}`);
  if (brandId) url.searchParams.set("brandId", brandId);
  if (variantId) url.searchParams.set("variantId", variantId);
  return requestJson(url, { signal });
};

export default function ShoppingListScreen() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState(null);
  const [brandId, setBrandId] = useState("");
  const [variantId, setVariantId] = useState("");
  const listKey = ["shopping-list", user?.id];
  const list = useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) => requestJson("/api/shopping-list", { signal }),
  });
  const items = list.data?.items ?? [];
  const updateList = useMutation({
    mutationFn: ({ method, id, data }) => requestJson(
      id ? `/api/shopping-list/${encodeURIComponent(id)}` : "/api/shopping-list",
      { method, data },
    ),
    onSuccess: (saved, { method, id }) => {
      queryClient.setQueryData(listKey, (previous) => {
        const rows = previous?.items ?? [];
        if (method === "DELETE") return { items: rows.filter((row) => row.id !== id) };
        const exists = rows.some((row) => row.id === saved.id);
        return { items: exists ? rows.map((row) => row.id === saved.id ? saved : row) : [...rows, saved] };
      });
      return queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 250);
    return () => clearTimeout(timer);
  }, [input]);

  const products = useInfiniteProducts(search, { queryScope: user?.id });
  const options = products.data?.pages.flatMap((page) => page.products) ?? [];
  const recommendations = useQueries({
    queries: items.map((item) => ({
      queryKey: ["shopping-recommendation", user?.id, item.productId, item.brandId, item.variantId],
      queryFn: ({ signal }) => loadRecommendation(item, signal),
      staleTime: 60_000,
    })),
  });

  const groups = new Map();
  items.forEach((item, index) => {
    const query = recommendations[index];
    const recommendation = query.data?.recommendation;
    const key = recommendation?.shopId ?? "";
    if (!groups.has(key)) {
      groups.set(key, {
        title: recommendation?.shopName ?? t("shoppingList.unassigned"),
        rows: [],
      });
    }
    groups.get(key).rows.push({ item, query, recommendation });
  });

  const locale = language === "en" ? "en-GB" : "nb-NO";
  const price = new Intl.NumberFormat(locale, { style: "currency", currency: "NOK" });
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Oslo",
  });
  const sortedGroups = [...groups].sort(([firstId, first], [secondId, second]) =>
    Number(!firstId) - Number(!secondId) || first.title.localeCompare(second.title, locale)
  );
  const itemId = product ? [product._id, brandId, variantId].join(":") : "";
  const alreadyAdded = items.some(({ id }) => id === itemId);

  const selectProduct = (next) => {
    setProduct(next);
    setBrandId("");
    setVariantId("");
  };

  const addItem = (event) => {
    event.preventDefault();
    if (!product || alreadyAdded || updateList.isPending || !list.isSuccess) return;

    updateList.mutate({ method: "POST", data: { productId: product._id, brandId, variantId } }, {
      onSuccess: () => {
        selectProduct(null);
        setInput("");
      },
    });
  };

  return (
    <PageLayout maxWidth={1100} spacing={2.5}>
      <Stack direction="row" alignItems="center" spacing={1.75} sx={{ pt: 1 }}>
        <Box sx={(theme) => ({
          display: "grid", placeItems: "center", width: 48, height: 48, flexShrink: 0,
          borderRadius: "14px", color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.13),
        })}>
          <ShoppingCartOutlinedIcon />
        </Box>
        <Box>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            {t("navShoppingList")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t("shoppingList.method")}
          </Typography>
        </Box>
      </Stack>
      {list.isError && (
        <Alert severity="error" action={<Button color="inherit" onClick={() => list.refetch()}>{t("shoppingList.retry")}</Button>}>
          {t("shoppingList.listError")}
        </Alert>
      )}
      {updateList.isError && <Alert severity="error">{t("shoppingList.saveError")} {updateList.error.message}</Alert>}
      <Box component="form" onSubmit={addItem} sx={{
        bgcolor: "background.paper", border: "1px solid", borderColor: "divider",
        borderRadius: "14px", p: { xs: 1.25, sm: 1.75 },
      }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
          <Autocomplete
            size="small"
            options={options}
            disabled={updateList.isPending}
            value={product}
            getOptionKey={(option) => option._id}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            filterOptions={(matches) => matches}
            loading={products.isFetching || (!product && input.trim() !== search)}
            onChange={(_, next) => selectProduct(next)}
            onInputChange={(_, value, reason) => {
              if (reason === "input" || reason === "clear") setInput(value);
            }}
            slotProps={{
              listbox: {
                onScroll: (event) => {
                  const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
                  if (scrollHeight - scrollTop - clientHeight < 48 &&
                      products.hasNextPage && !products.isFetching) {
                    products.fetchNextPage();
                  }
                },
              },
            }}
            sx={{ flex: 2, minWidth: 0 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("shoppingList.product")}
                error={products.isError}
                helperText={products.isError ? t("shoppingList.productError") : undefined}
              />
            )}
          />
          <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={!product || alreadyAdded || updateList.isPending || !list.isSuccess}>
            {t(alreadyAdded ? "shoppingList.alreadyAdded" : "shoppingList.add")}
          </Button>
        </Stack>
        {product && Boolean(product.brandOptions?.length || product.variants?.length) && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 1.25 }}>
            {[
              { label: "brand", value: brandId, set: setBrandId, options: product?.brandOptions },
              { label: "variant", value: variantId, set: setVariantId, options: product?.variants },
            ].filter((field) => field.options?.length).map((field) => (
              <TextField
                key={field.label}
                size="small"
                select
                label={t(`shoppingList.${field.label}`)}
                value={field.value}
                disabled={updateList.isPending || !field.options?.length}
                onChange={(event) => field.set(event.target.value)}
                sx={{ flex: 1, minWidth: 0 }}
              >
                <MenuItem value="">{t("shoppingList.any")}</MenuItem>
                {field.options?.map(({ _id, name }) => (
                  <MenuItem key={_id} value={_id}>{name}</MenuItem>
                ))}
              </TextField>
            ))}
          </Stack>
        )}
      </Box>

      {list.isPending && <Typography color="text.secondary">{t("shoppingList.listLoading")}</Typography>}
      {list.isSuccess && !items.length && (
        <Stack alignItems="center" spacing={1} sx={{ py: 5, px: 2, border: "1px dashed", borderColor: "divider", borderRadius: "14px" }}>
          <ShoppingCartOutlinedIcon color="action" />
          <Typography variant="body2" color="text.secondary" textAlign="center">{t("shoppingList.empty")}</Typography>
        </Stack>
      )}

      {items.length > 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
          <Typography component="h2" variant="subtitle1" fontWeight={750}>{t("shoppingList.byShop")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("shoppingList.progress", { checked: items.filter(({ checked }) => checked).length, total: items.length })}
          </Typography>
        </Stack>
      )}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))",
        gap: 2,
        alignItems: "start",
      }}>
        {sortedGroups.map(([key, group]) => (
          <Box
            key={key}
            component="section"
            sx={{
              minWidth: 0, bgcolor: "background.paper", border: "1px solid",
              borderColor: "divider", borderRadius: "14px", overflow: "hidden",
              boxShadow: "0 5px 16px rgba(0, 0, 0, 0.08)",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25} sx={(theme) => ({
              px: 2, py: 1.5, borderBottom: "1px dashed", borderColor: "divider",
              bgcolor: key ? alpha(theme.palette.primary.main, 0.08) : "action.hover",
            })}>
              <StorefrontOutlinedIcon fontSize="small" color={key ? "primary" : "action"} />
              <Typography component="h3" variant="subtitle1" fontWeight={800} sx={{ flex: 1, overflowWrap: "anywhere" }}>
                {group.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                {t(group.rows.length === 1 ? "shoppingList.oneItem" : "shoppingList.itemCount", { count: group.rows.length })}
              </Typography>
            </Stack>
            <Stack component="ul" divider={<Divider component="li" />} sx={{ listStyle: "none", px: 1.25, py: 0.5, m: 0 }}>
              {group.rows.map(({ item, query, recommendation }) => (
                <Stack key={item.id} component="li" direction="row" alignItems="center" spacing={0.5} sx={{ py: 1, minHeight: 56 }}>
                  <Checkbox
                    size="small"
                    checked={item.checked}
                    disabled={updateList.isPending}
                    onChange={(_, checked) => updateList.mutate({ method: "PATCH", id: item.id, data: { checked } })}
                    slotProps={{ input: { "aria-label": t("shoppingList.check", { name: item.name }) } }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} sx={{
                      overflowWrap: "anywhere", textDecoration: item.checked ? "line-through" : "none",
                      color: item.checked ? "text.secondary" : "text.primary",
                    }}>
                      {item.name}
                    </Typography>
                    {item.details && <Typography variant="body2" color="text.secondary">{item.details}</Typography>}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {recommendation
                        ? t("shoppingList.recorded", { date: date.format(new Date(recommendation.date)) })
                        : t(query.isPending ? "shoppingList.loading" : query.isError ? "shoppingList.priceError" : "shoppingList.noPrice")}
                    </Typography>
                  </Box>
                  {recommendation && (
                    <Typography variant="body2" fontWeight={700} sx={{ flexShrink: 0, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {price.format(recommendation.unitPrice)}
                      <Box component="span" sx={{ color: "text.secondary", fontSize: "0.75rem", fontWeight: 400 }}>
                        {" / "}{recommendation.unit}
                      </Box>
                    </Typography>
                  )}
                  {query.isError && (
                    <Button size="small" onClick={() => query.refetch()}>{t("shoppingList.retry")}</Button>
                  )}
                  <IconButton
                    size="small"
                    sx={{ color: "text.secondary" }}
                    aria-label={t("shoppingList.remove", { name: item.name })}
                    disabled={updateList.isPending}
                    onClick={() => updateList.mutate({ method: "DELETE", id: item.id })}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
    </PageLayout>
  );
}

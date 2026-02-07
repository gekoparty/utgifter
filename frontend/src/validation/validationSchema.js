import * as Yup from "yup";

export const addBrandValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Navn kan ikke være tomt")
    .min(1, "Navnet må være minst 2 tegn")
    .max(30, "Maks 30 tegn")
    .notOneOf(["Admin", "SuperAdmin"], "Ugyldig merkenavn"),
});

export const addLocationValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Navn kan ikke være tomt")
    .min(2, "Navnet må være minst 2 tegn")
    .max(30, "Maks 30 tegn")
    .notOneOf(["Admin", "SuperAdmin"], "Ugyldig merkenavn"),
});

export const addCategoryValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Navn kan ikke være tomt")
    .min(2, "Navnet må være minst 2 tegn")
    .max(30, "Maks 30 tegn")
    .notOneOf(["Admin", "SuperAdmin"], "Ugyldig merkenavn"),
});

export const addProductValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Navn kan ikke være tomt")
    .min(2, "Navnet må være minst 2 tegn")
    .max(50, "Maks 50 tegn")
    .notOneOf(["Admin", "SuperAdmin"], "Ugyldig merkenavn"),

  brands: Yup.array()
    .of(Yup.string().trim().required("Brand navn er påkrævet"))
    .min(1, "Må ha minst ett merke")
    .required("Må ha minst ett merke"),

  category: Yup.string()
    .trim()
    .required("Kategori er påkrevd")
    .min(1, "Kategori er påkrevd"),

  // ✅ variants OPTIONAL
  variants: Yup.array().of(Yup.string().trim().min(1)).notRequired(),

  measurementUnit: Yup.string().required("Må ha måleenhet"),

  measures: Yup.array().of(Yup.string().trim().min(1)).notRequired(),
});

export const addExpenseValidationSchema = Yup.object()
  .shape({
    productName: Yup.string()
      .required("Navn kan ikke være tomt")
      .min(2, "Navnet må være minst 2 tegn")
      .max(50, "Maks 50 tegn"),
    shopName: Yup.string()
      .required("Navn kan ikke være tomt")
      .min(2, "Navnet må være minst 2 tegn")
      .max(40, "Maks 40 tegn"),
    brandName: Yup.string()
      .required("Navn kan ikke være tomt")
      .min(1, "Navnet må være minst 1 tegn")
      .max(40, "Maks 40 tegn"),
    volume: Yup.number()
      .required("Må ha et volum")
      .positive("Må være positivt"),
    price: Yup.number().required("Må ha en pris").positive("Må være positivt"),
    hasDiscount: Yup.boolean(),
    discountValue: Yup.number().when("hasDiscount", {
      is: true,
      then: (schema) =>
        schema.required("Må ha rabattverdi").positive("Må være positivt"),
      otherwise: (schema) => schema.nullable(),
    }),
    quantity: Yup.number()
      .required("Må ha et antall")
      .positive("Må være positivt"),
    purchaseDate: Yup.date().nullable(),
    registeredDate: Yup.date().nullable(),
  })
  .test(
    "date-validation",
    "Må ha en kjøpsdato eller registreringsdato, men ikke begge",
    function (value) {
      const { purchaseDate, registeredDate } = value || {};
      return !(
        (purchaseDate && registeredDate) ||
        (!purchaseDate && !registeredDate)
      );
    },
  );

export const addShopValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Navn kan ikke være tomy")
    .min(2, "Navnet må være minst 2 tegn")
    .max(30, "Maks 30 tegn"),
  locationName: Yup.string()
    .required("Må ha et sted")
    .min(2, "Lokasjon må være minst 2 tegn")
    .max(30, "Maks 30 tegn"),
  categoryName: Yup.string()
    .required("Må ha en kategori")
    .min(2, "Må være minst 2 tegn")
    .max(30, "Maks 30 tegn"),
});

export const recurringExpenseValidationSchema = Yup.object()
  .shape({
    title: Yup.string()
      .required("Tittel kan ikke være tom")
      .min(2, "Tittel må være minst 2 tegn")
      .max(80, "Maks 80 tegn"),

    type: Yup.string()
      .required("Type er påkrevd")
      .oneOf(
        ["MORTGAGE", "UTILITY", "INSURANCE", "SUBSCRIPTION"],
        "Ugyldig type",
      ),

    dueDay: Yup.number()
      .required("Forfallsdag er påkrevd")
      .min(1, "Forfallsdag må være mellom 1 og 28")
      .max(28, "Forfallsdag må være mellom 1 og 28"),

    amount: Yup.number()
      .required("Månedlig beløp er påkrevd")
      .min(0, "Beløp kan ikke være negativt"),

    estimateMin: Yup.number().min(0, "Kan ikke være negativt").notRequired(),
    estimateMax: Yup.number().min(0, "Kan ikke være negativt").notRequired(),

    // Mortgage-only fields
    mortgageHolder: Yup.string().when("type", {
      is: "MORTGAGE",
      then: (s) =>
        s
          .required("Må ha långiver/bank")
          .min(2, "Långiver må være minst 2 tegn")
          .max(60, "Maks 60 tegn"),
      otherwise: (s) => s.notRequired(),
    }),

    mortgageKind: Yup.string().when("type", {
      is: "MORTGAGE",
      then: (s) =>
        s
          .required("Må ha type lån")
          .min(2, "Type lån må være minst 2 tegn")
          .max(40, "Maks 40 tegn"),
      otherwise: (s) => s.notRequired(),
    }),

    remainingBalance: Yup.number().when("type", {
      is: "MORTGAGE",
      then: (s) =>
        s
          .required("Må ha restgjeld")
          .moreThan(0, "Restgjeld må være større enn 0"),
      otherwise: (s) => s.notRequired(),
    }),

    interestRate: Yup.number().when("type", {
      is: "MORTGAGE",
      then: (s) =>
        s
          .required("Må ha rente")
          .min(0, "Rente kan ikke være negativ")
          .max(50, "Rente virker for høy"),
      otherwise: (s) => s.notRequired(),
    }),

    hasMonthlyFee: Yup.boolean().default(false),

    monthlyFee: Yup.number().when(["type", "hasMonthlyFee"], {
      is: (type, hasMonthlyFee) =>
        type === "MORTGAGE" && hasMonthlyFee === true,
      then: (s) =>
        s.required("Må ha gebyrbeløp").min(0, "Gebyr kan ikke være negativt"),
      otherwise: (s) => s.notRequired(),
    }),
  })
  .test(
    "non-mortgage-amount-or-estimate",
    "Må ha enten månedlig beløp eller estimatintervall (min/maks)",
    function (value) {
      if (!value) return false;
      if (value.type === "MORTGAGE") return true;

      const amountOk = Number(value.amount || 0) > 0;
      const estOk =
        Number(value.estimateMin || 0) > 0 &&
        Number(value.estimateMax || 0) >= Number(value.estimateMin || 0);

      return amountOk || estOk;
    },
  );

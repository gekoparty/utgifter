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
  variants: Yup.array()
    .of(Yup.string().trim().min(1))
    .notRequired(),

  measurementUnit: Yup.string().required("Må ha måleenhet"),

  measures: Yup.array()
    .of(Yup.string().trim().min(1))
    .notRequired(),
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
    quantity: Yup.number().required("Må ha et antall").positive("Må være positivt"),
    purchaseDate: Yup.date().nullable(),
    registeredDate: Yup.date().nullable(),
  })
  .test(
    "date-validation",
    "Må ha en kjøpsdato eller registreringsdato, men ikke begge",
    function (value) {
      const { purchaseDate, registeredDate } = value || {};
      return !((purchaseDate && registeredDate) || (!purchaseDate && !registeredDate));
    }
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

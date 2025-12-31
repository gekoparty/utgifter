// src/validation/validationSchema.js (only the Product schema section updated)
import * as Yup from "yup";

export const addProductValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Navn kan ikke være tomt")
    .min(2, "Navnet må være minst 2 tegn")
    .max(50, "Maks 50 tegn")
    .notOneOf(["Admin", "SuperAdmin"], "Ugyldig merkenavn"),

  // ✅ match UI requirement: at least one brand
  brands: Yup.array()
    .of(Yup.string().required("Brand navn er påkrævet"))
    .min(1, "Må ha minst ett merke"),

  // ✅ you require this in UI
  type: Yup.string().required("Må ha produkttype"),

  measurementUnit: Yup.string().required("Må ha måleenhet"),

  measures: Yup.array().of(Yup.string()), // optional
});

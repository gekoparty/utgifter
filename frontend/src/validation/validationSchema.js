import * as Yup from "yup";

export const addBrandValidationSchema = Yup.object().shape({
    brandName: Yup.string()
      .required("Navn kan ikke være tomt")
      .min(2, "Navnet må være minst 2 tegn")
      .max(20, "Maks 20 tegn")
      .notOneOf(["Admin", "SuperAdmin"], "Ugyldig merkenavn"),
  });
import * as Yup from "yup";

export const addBrandValidationSchema = Yup.object().shape({
    brandName: Yup.string()
      .required("Navn kan ikke være tomt")
      .min(2, "Navnet må være minst 2 tegn")
      .max(20, "Maks 20 tegn")
      .notOneOf(["Admin", "SuperAdmin"], "Ugyldig merkenavn"),
  });

  export const addLocationValidationSchema = Yup.object().shape({
    locationName: Yup.string()
      .required("Navn kan ikke være tomt")
      .min(2, "Navnet må være minst 2 tegn")
      .max(20, "Maks 20 tegn")
      .notOneOf(["Admin", "SuperAdmin"], "Ugyldig merkenavn"),
  });

  export const addCategoryValidationSchema = Yup.object().shape({
    categoryName: Yup.string()
      .required("Navn kan ikke være tomt")
      .min(2, "Navnet må være minst 2 tegn")
      .max(20, "Maks 20 tegn")
      .notOneOf(["Admin", "SuperAdmin"], "Ugyldig merkenavn"),
  });

  export const addShopValidationSchema = Yup.object().shape({
    name: Yup.string()
      .required("Navn kan ikke være tomy")
      .min(2, "Navnet må være minst 2 tegn")
      .max(20, "Maks 20 tegn"),
    location: Yup.string()
      .required("Må ha et sted")
      .min(2, "Lokasjon må være minst 2 tegn")
      .max(20, "Maks 20 tegn"),
    category: Yup.string()
      .required("Må ha en kategori")
      .min(2, "Må være minst 2 tegn")
      .max(20, "Maks 20 tegn"),
  });
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

export const addProductValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Navn kan ikke være tomt")
    .min(2, "Navnet må være minst 2 tegn")
    .max(30, "Maks 20 tegn")
    .notOneOf(["Admin", "SuperAdmin"], "Ugyldig merkenavn"), 
    brands: Yup.array().of(Yup.string().required("Brand navn er påkrævet")),
    measurementUnit: Yup.string().required("Må ha måleenhet")
});

export const addExpenseValidationSchema = Yup.object().shape({
  productName: Yup.string()
    .required("Navn kan ikke være tomt")
    .min(2, "Navnet må være minst 2 tegn")
    .max(30, "Maks 20 tegn"),
  shopName: Yup.string()
    .required("Navn kan ikke være tomt")
    .min(2, "Navnet må være minst 2 tegn")
    .max(20, "Maks 20 tegn"),
  brandName: Yup.string()
    .required("Navn kan ikke være tomt")
    .min(2, "Navnet må være minst 2 tegn")
    .max(20, "Maks 20 tegn"),
  volume: Yup.number()
    .required("Må ha et volum")
    .positive("Må være positivt"),
  price: Yup.number()
    .required("Må ha en pris")
    .positive("Må være positivt"),
  hasDiscount: Yup.boolean(),
  discountValue: Yup.number().when("hasDiscount", {
    is: true,
    then: schema => {
      console.log("hasDiscount is true");
      return schema.required("Må ha rabattverdi").positive("Må være positivt");
    },
    otherwise: schema => {
      console.log("hasDiscount is false");
      return schema.nullable();
    },
  }),
  quantity: Yup.number()
    .required("Må ha et antall")
    .positive("Må være positivt"),
  purchaseDate: Yup.date().nullable(),
  registeredDate: Yup.date().nullable(),
}).test('date-validation', 'Må ha en kjøpsdato eller registreringsdato, men ikke begge', function (value) {
  const { purchaseDate, registeredDate } = value || {};
  console.log("purchaseDate:", purchaseDate, "registeredDate:", registeredDate);
  if ((purchaseDate && registeredDate) || (!purchaseDate && !registeredDate)) {
    return false;
  }
  return true;
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

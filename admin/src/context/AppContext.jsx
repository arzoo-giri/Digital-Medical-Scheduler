import { createContext } from "react";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currency = "$";

  const calculateAge = (dob) => {
    const today = new Date();

    const birthDate = new Date(dob);

    let age = today.getFullYear() - birthDate.getFullYear();

    if (
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const months = [
    "",

    "Jan",

    "Feb",

    "Mar",

    "Apr",

    "May",

    "Jun",

    "Jul",

    "Aug",

    "Sep",

    "Oct",

    "Nov",

    "Dec",
  ];


  const slotDateFormat = (slotDate) => {
    if (!slotDate || typeof slotDate !== "string") {
      return "N/A";
    }

    const separator = slotDate.includes("-") ? "-" : "/";

    const dateParts = slotDate.split(separator);

    if (dateParts.length !== 3) {
      return "N/A";
    }

    const year = dateParts[0];

    const monthIndex = Number(dateParts[1]); 

    const day = dateParts[2]; 

    if (monthIndex < 1 || monthIndex > 12) {
      return "N/A";
    }

    return day + " " + months[monthIndex] + " " + year;
  };

  const value = {
    calculateAge,

    slotDateFormat,

    currency,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;

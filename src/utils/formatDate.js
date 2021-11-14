const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const shortMonths = [
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

const monthDayFormat = (date) => {
  const formatDate = new Date(date);

  return `${months[formatDate.getMonth()]} ${formatDate.getDate()}`;
};

const shortFormat = (date) => {
  const formatDate = new Date(typeof date === "string" ? new Date(date) : date);

  return formatDate
    .toLocaleString("fr-FR", { timeZone: "UTC" })
    .slice(0, 10 /* 16 */);

  // return new Date().;
};

const ISOFormat = (date) => {
  const formatDate = new Date(date);

  return `${formatDate.toISOString().replace("T", " ").slice(0, 10 /* 16 */)}`;
};

export { monthDayFormat, shortFormat, ISOFormat };

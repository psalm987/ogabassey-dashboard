const OBJECT_FIELDS = [
  "id",
  "_id",
  "name",
  "price",
  "imageUrl",
  "type",
  "discountCost",
  "description",
  "specs",
];

export const FormatCSV = (array: [any[]] | unknown[]) => {
  if (Array.isArray(array) && array.every((item) => Array.isArray(item))) {
    const headers: any[] = array[0];
    const result = array
      .slice(1)
      .map((item) =>
        headers
          .map((header, i) => ({ [header]: item[i] }))
          .reduce(
            (prev, curr) =>
              OBJECT_FIELDS.includes(Object.keys(curr)[0])
                ? { ...prev, ...curr }
                : prev,
            {}
          )
      );
    console.log(result, "RESULT >>>");
    return result as ProductProps[];
  }
};

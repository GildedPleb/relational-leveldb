export const mapFieldType = (type: string) => {
  switch (type) {
    case "Int":
      return "number";
    case "String":
      return "string";
    case "Boolean":
      return "boolean";
    case "DateTime":
      return "string";
    case "Float":
      return "number";
    case "BigInt":
      return "number";
    default:
      return false;
  }
};

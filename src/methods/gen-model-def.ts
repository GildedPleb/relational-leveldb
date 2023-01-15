import { mapFieldType } from "./utils";
import type { ModelType } from "../generator";

export default function modelDefinitions(models: ModelType[]) {
  return `${models
    .map((model) => {
      const deadFields: string[] = model.fields.reduce((r, f) => {
        if (f.relationFromFields) r.push(...f.relationFromFields);
        return r;
      }, [] as string[]);
      return `type ${model.name} = {${model.fields
        .map((field) => {
          if (deadFields.includes(field.name)) return "";
          return `
  ${field.name}: ${
            field.isList
              ? `${field.type}Id[]`
              : field.isId
              ? `${model.name}Id`
              : mapFieldType(field.type)
              ? mapFieldType(field.type)
              : `${field.type}Id`
          }${!field.isRequired ? " | null" : ""};`;
        })
        .join("")}
}
type Create${model.name} = {${model.fields
        .map((field) => {
          if (deadFields.includes(field.name)) return "";
          return `
  ${field.name}${field.hasDefaultValue || !field.isRequired ? "?" : ""}: ${
            field.isList
              ? `${field.type}Id[]`
              : field.isId
              ? `${model.name}Id`
              : mapFieldType(field.type)
              ? mapFieldType(field.type)
              : `${field.type}Id`
          };`;
        })
        .join("")}
}
type Update${model.name} = {${model.fields
        .map((field) => {
          if (deadFields.includes(field.name)) return "";
          return `
  ${field.name}${field.isId ? "" : "?"}: ${
            field.kind !== "scalar"
              ? field.isList
                ? `LinkMany<${field.type}Id>`
                : `${field.type}Id`
              : field.isId
              ? `${model.name}Id`
              : mapFieldType(field.type)
          }${!field.isRequired ? " | null" : ""};`;
        })
        .join("")}
}
type Populated${model.name} = {${model.fields
        .map((field) => {
          if (deadFields.includes(field.name)) return "";
          return `
  ${field.name}: ${
            field.isList
              ? `${field.type}Id[] | Populated${field.type}[]`
              : field.isId
              ? `${model.name}Id`
              : mapFieldType(field.type)
              ? mapFieldType(field.type)
              : `${field.type}Id | ${field.type}`
          }${!field.isRequired ? " | null" : ""};`;
        })
        .join("")}
}
`;
    })
    .join("")}
type PopulatedTypes = {${models
    .map((model) => {
      return `
  ${model.name}: Populated${model.name};`;
    })
    .join("")}
};

type PopulatedTypesId = {${models
    .map((model) => {
      return `
  [x: ${model.name}Id]: Populated${model.name};`;
    })
    .join("")}
};
`;
}

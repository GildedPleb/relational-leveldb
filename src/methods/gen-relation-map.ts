import type { ModelType } from "../generator";

export type RelationMap = { [x: string]: { [x: string]: string } };
export type TypeMap = { [x: string]: string };
export type SafetyMap = { [x: string]: { [x: string]: boolean } };

export default function relationMap(
  models: ModelType[]
): [RelationMap, TypeMap, SafetyMap] {
  const map: RelationMap = {};
  const types: TypeMap = {};
  const safety: SafetyMap = {};
  models.forEach((model) => {
    model.fields.forEach((field) => {
      if (field.relationName) {
        if (!map[field.relationName]) {
          map[field.relationName] = {};
          safety[field.relationName] = {};
          types[field.relationName] = field.isList ? "many-to-" : "one-to-";
        } else {
          types[field.relationName] = field.isList
            ? `${types[field.relationName]}many`
            : `${types[field.relationName]}one`;
        }
        map[field.relationName][model.name] = field.name;
        safety[field.relationName][model.name] = field.isRequired;
      }
    });
  });
  return [map, types, safety];
}

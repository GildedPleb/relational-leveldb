import type { ModelType } from "../generator";
import { mapFieldType } from "./utils";
import type { RelationMap, TypeMap, SafetyMap } from "./gen-relation-map";

export default function createMethods(
  model: ModelType,
  [relationMap, typeMap, safetyMap]: [RelationMap, TypeMap, SafetyMap]
) {
  const idField = model.fields.filter((f) => f.isId)[0];
  const deadFields: string[] = model.fields.reduce((r, f) => {
    if (f.relationFromFields) r.push(...f.relationFromFields);
    return r;
  }, [] as string[]);
  const uniqueFields = [
    ...model.uniqueFields.map((fields) =>
      fields.filter((f) => !deadFields.includes(f))
    ),
    ...model.fields
      .filter((f) => f.isUnique && !deadFields.includes(f.name))
      .map((f) => [f.name]),
  ];
  return `
    // update method for ${model.name}
    update: async (data: Update${model.name}): Promise<${model.name}> => {
      const oldData = await this.findOne(data.${idField.name});
      if (!oldData)
        throw new Error(
          \`Can not update \${data.${
            idField.name
          }}, as it does not exist in the database. \`
        );
      const finalData = oldData as ${model.name};
      ${
        uniqueFields.length > 0
          ? `
      // Evaluate Unique Fields: [${uniqueFields.join("] / [")}]
      const all${
        model.name
      }s = await this.${model.name.toLowerCase()}.findMany();
      for (const uniqueField of [["${uniqueFields
        .map((f) => f.join('", "'))
        .join('"], ["')}"]] as (keyof Populated${model.name})[][]) {
        const newRecord = uniqueField.map((f) => f in data ? data[f] : "").join("-");
        for (const ${model.name.toLowerCase()} of all${model.name}s) {
          const existingRecord = uniqueField.map((f) => ${model.name.toLowerCase()}[f] !== null ? ${model.name.toLowerCase()}[f] : "null" ).join("-");
          if (newRecord === existingRecord)
            throw new Error(\`Must provide unique values to the "\${uniqueField.join(", ")}" key(s) when updating a(n) ${
              model.name
            }. Got: \${newRecord}\`)
        }
      }
      `
          : ""
      }
      ${model.fields
        .map(
          ({
            name,
            type,
            relationToFields,
            relationFromFields,
            isList,
            relationName,
          }) => {
            const singularName = type.toLowerCase();

            if (!relationName || !relationToFields || !relationFromFields)
              return "";
            if (
              relationFromFields.length === 0 &&
              relationToFields.length === 0 &&
              isList &&
              (typeMap[relationName] === "one-to-many" ||
                typeMap[relationName] === "many-to-one") &&
              safetyMap[relationName][type]
            )
              return `// Check the ${name} prop: One-to-Many: Many Side
      if ("${name}" in data && data.${name} && data.${name}.unlink) {
        for await (const ${singularName} of data.${name}.unlink) {
          const key = new Key(${singularName} as string);
          if (await this.db.has(key))
            throw new Error(\`Can not unlink "\${${singularName}}" from "\${data.${idField.name}}" by updating "\${data.${idField.name}}" as "\${${singularName}}" has a dependent/required relationship. You must first update "\${${singularName}}" to point to a differnt ${model.name}. \`)
        }
      }
      `;
            if (
              typeMap[relationName] === "one-to-one" &&
              safetyMap[relationName][type]
            )
              return `// Check the ${name} prop: One-to-One
      if ("${name}" in data && data.${name}) {
        const key = new Key(data.${name} as string);
        if (await this.db.has(key))
          throw new Error(\`Can not change the link to "\${data.${name}}" from "\${data.${idField.name}}" by updating "\${data.${idField.name}}" as "\${data.${name}}" has a dependent/required relationship. You must first update "\${data.${name}}" to point to a differnt ${model.name}. \`)
      }`;
          }
        )
        .join("")}
      const batch = this.db.batch();
      ${model.fields
        .map(
          ({
            name,
            kind,
            type,
            relationToFields,
            relationFromFields,
            isList,
            hasDefaultValue,
            default: def,
            isId,
            relationName,
            isRequired,
          }) => {
            const singularName = type.toLowerCase();
            if (deadFields.includes(name)) return "";
            if (isId) return "";

            if (kind === "scalar" && !hasDefaultValue && isRequired)
              return `// Process the required "${name}" prop with no defaults
      if ("${name}" in data && data.${name})
        finalData.${name} = data.${name};

      `;
            if (kind === "scalar" && !hasDefaultValue && !isRequired)
              return `// Process the not-required "${name}" prop with no defaults
      if ("${name}" in data && data.${name} !== undefined)
        finalData.${name} = data.${name};

      `;
            if (kind === "scalar" && typeof def !== "object")
              return `// Process the "${name}" prop with scalar defaults
      if ("${name}" in data && data.${name})
        finalData.${name} = data.${name};

      `;
            if (kind === "scalar" && typeof def === "object") {
              if ("name" in def && def.name === "now")
                return `// Process the "${name}" prop with non-scalar defaults
      if ("${name}" in data && data.${name})
        finalData.${name} = data.${name};

      `;

              throw new Error(
                "UNIMPLAMENTED: @default(...) with anything but string, number, or 'now()' on a non-id value is unimplamented"
              );
            }

            if (!relationName || !relationToFields || !relationFromFields)
              throw new Error(
                "Internal Prisma Error, no 'relationName', 'relationToFields', or 'relationFromFields' defined"
              );
            if (
              isList &&
              relationToFields.length !== 0 &&
              relationFromFields.length === 0 &&
              typeMap[relationName] === "many-to-many"
            )
              return `// Process the ${name} prop: Many-to-Many
      if ("${name}" in data && data.${name}) {
        let interim = [...oldData.${name} as ${type}Id[]];
        if (data.${name}.unlink) {
          for await (const ${singularName} of data.${name}.unlink) {
            const key = new Key(${singularName});
            if (!(await this.db.has(key)))
              throw new Error(\`Can not unlink "\${${singularName}}" as it does not exist in the database.\`)
            const old${type} = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
            if (old${type}.${relationMap[relationName][type]}.includes(data.${idField.name})) {
              old${type}.${relationMap[relationName][type]} = old${type}.${relationMap[relationName][type]}.filter((i) => i !== data.${idField.name});
              batch.put(key, StrToUI8(JSON.stringify(old${type})));
            }
          }
          for (const ${singularName} of data.${name}.unlink) {
            interim = interim.filter((i) => i !== ${singularName});
          }
        }
        if (data.${name}.link) {
          for await (const ${singularName} of data.${name}.link) {
            const key = new Key(${singularName});
            if (!(await this.db.has(key)))
              throw new Error(\`Can not link "\${${singularName}}" as it does not exist in the database.\`)
            const old${type} = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
            if (!old${type}.${relationMap[relationName][type]}.includes(data.${idField.name})) {
              old${type}.${relationMap[relationName][type]}.push(data.${idField.name});
              batch.put(key, StrToUI8(JSON.stringify(old${type})));
            }
          }
          interim = [...interim, ...data.${name}.link];
        }
        finalData.${name} = interim.filter((v, i, arr) => arr.indexOf(v) === i);
      }

      `;
            if (
              relationFromFields.length === 0 &&
              relationToFields.length === 0 &&
              isList &&
              (typeMap[relationName] === "one-to-many" ||
                typeMap[relationName] === "many-to-one")
            ) {
              if (safetyMap[relationName][type]) return "";
              return `// Process the ${name} prop: One-to-Many: Many Side
      if ("${name}" in data && data.${name}) {
        let interim = [...oldData.${name} as ${type}Id[]];
        if (data.${name}.unlink) {
          for await (const ${singularName} of data.${name}.unlink) {
            const key = new Key(${singularName});
            if (!(await this.db.has(key)))
              throw new Error(\`Can not unlink "\${${singularName}}" as it does not exist in the database.\`)
            const old${type} = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
            if (old${type}.${relationMap[relationName][type]} === data.${idField.name}) {
              old${type}.${relationMap[relationName][type]} = null;
              batch.put(key, StrToUI8(JSON.stringify(old${type})));
            }
          }
          for (const ${singularName} of data.${name}.unlink) {
            interim = interim.filter((i) => i !== ${singularName});
          }
        }
        if (data.${name}.link) {
          for await (const ${singularName} of data.${name}.link) {
            const key = new Key(${singularName});
            if (!(await this.db.has(key)))
              throw new Error(\`Can not link "\${${singularName}}" as it does not exist in the database.\`)
            const old${type} = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
            if (old${type}.${relationMap[relationName][type]} !== data.${idField.name}) {
              if (old${type}.${relationMap[relationName][type]} === null) {
                old${type}.${relationMap[relationName][type]} = data.${idField.name};
                batch.put(key, StrToUI8(JSON.stringify(old${type})));
              } else {
                throw new Error(\`Can not link "\${${singularName}}" as it is already linked to another ${relationMap[relationName][type]}: "\${old${type}.${relationMap[relationName][type]}}". First, unlink it from that ${relationMap[relationName][type]} then link it with "\${data.${idField.name}}".\`)
              }
            }
          }
          interim = [...interim, ...data.${name}.link];
        }
        finalData.${name} = interim.filter((v, i, arr) => arr.indexOf(v) === i);
      }

      `;
            }
            if (
              relationFromFields.length > 0 &&
              relationToFields.length > 0 &&
              !isList &&
              (typeMap[relationName] === "one-to-many" ||
                typeMap[relationName] === "many-to-one")
            )
              return `// Process the ${name} prop: One-to-Many: One Side
      if (data.${name}) {
        const prevKey = new Key(oldData.${name} as string);
        if (!(await this.db.has(prevKey)))
          throw new Error(\`Can not unlink "\${oldData.${name}}" as it does not exist in the database.\`)
        const key = new Key(data.${name});
        if (!(await this.db.has(key)))
          throw new Error(\`Can not link "\${data.${name}}" as it does not exist in the database.\`)
        const prev${type} = JSON.parse(UI8ToStr(await this.db.get(prevKey))) as ${type};
        if (prev${type}.${relationMap[relationName][type]}.includes(data.${
                idField.name
              })) {
          prev${type}.${relationMap[relationName][type]} = prev${type}.${
                relationMap[relationName][type]
              }.filter((i) => i !== data.${idField.name});
          batch.put(prevKey, StrToUI8(JSON.stringify(prev${type})));
        }
        const old${type} = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
        if (!old${type}.${relationMap[relationName][type]}.includes(data.${
                idField.name
              })) {
          old${type}.${relationMap[relationName][type]}.push(data.${
                idField.name
              });
          batch.put(key, StrToUI8(JSON.stringify(old${type})));
        }
        finalData.${name} = ${
                isRequired
                  ? `data.${name}`
                  : `data.${name} ? data.${name} : null`
              };
      }

      `;
            if (typeMap[relationName] === "one-to-one") {
              if (safetyMap[relationName][type]) return "";
              return `// Process the ${name} prop: One-to-One
      if ("${name}" in data && data.${name}) {
        const key = new Key(data.${name});
        if (!(await this.db.has(key)))
          throw new Error(\`Can not link "\${data.${name}}" as it does not exist in the database.\`)
        const oldKey = new Key(oldData.${name} as ${type}Id);
        const old${type} = JSON.parse(UI8ToStr(await this.db.get(oldKey))) as ${type};
        if (old${type}.${relationMap[relationName][type]} === data.${
                idField.name
              }) {
          old${type}.${relationMap[relationName][type]} = null;
          batch.put(oldKey, StrToUI8(JSON.stringify(old${type})));
        } else {
          throw new Error(\`Can not unlink "\${data.${name}}" as it is already linked to another ${
                relationMap[relationName][type]
              }: "\${old${type}.${
                relationMap[relationName][type]
              }}". First, link it to ${
                relationMap[relationName][type]
              } then unlink it with "\${data.${idField.name}}" from here.\`)
        }
        const new${type} = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
        if (new${type}.${relationMap[relationName][type]} === null) {
          new${type}.${relationMap[relationName][type]} = data.${idField.name};
          batch.put(key, StrToUI8(JSON.stringify(new${type})));
        } else {
          throw new Error(\`Can not link "\${data.${name}}" as it is already linked to another ${
                relationMap[relationName][type]
              }: "\${new${type}.${
                relationMap[relationName][type]
              }}". First, unlink it from that ${
                relationMap[relationName][type]
              } then link it with "\${data.${idField.name}}".\`)
        }

        finalData.${name} = ${
                isRequired
                  ? `data.${name}`
                  : `data.${name} ? data.${name} : null`
              };
      }

      `;
            }
            throw new Error(`Can not process field type "${name}"`);
          }
        )
        .join("")}batch.put(new Key(data.${
    idField.name
  }), StrToUI8(JSON.stringify(finalData)));
      await batch.commit();
      return finalData;
  	},`;
}

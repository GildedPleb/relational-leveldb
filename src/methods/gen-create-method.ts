import type { ModelType } from "../generator";
import { mapFieldType } from "./utils";
import type { RelationMap, TypeMap, SafetyMap } from "./gen-relation-map";

export default function createMethods(
  model: ModelType,
  [relationMap, typeMap]: [RelationMap, TypeMap, SafetyMap]
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

  return `// Create method for ${model.name}
    create: async (data: Create${model.name}): Promise<${model.name}> => {
      const finalData = {} as ${model.name};
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
            throw new Error(\`Must provide unique values to the "\${uniqueField.join(", ")}" key(s) when creating a new ${
              model.name
            }. Got: \${newRecord}\`)
        }
      }
      `
          : ""
      }
      // Process the ID
      const newId = data.${idField.name} || ("/${
    model.name
  }/" + ${` uuidv4())`} as ${model.name}Id;
      if (!validRelation.test(newId))
        throw new Error(
          \`Must give valid value to "${
            idField.name
          }" prop. Can not create a new ${
    model.name
  } with key id: "\${newId}", must match /^\\\\/([a-zA-Z0-9]+)\\\\/.+$/ \`
        );

      if (await this.db.has(new Key(newId)))
        throw new Error(
          \`Must give unique value to "${
            idField.name
          }" prop. Can not create a new ${model.name} with key id: "\${newId}"\`
        );
      finalData.${idField.name} = newId;
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
      finalData.${name} = data.${name};

      `;
            if (kind === "scalar" && !hasDefaultValue && !isRequired)
              return `// Process the not-required "${name}" prop with no defaults
      finalData.${name} = data.${name} ? data.${name} : null;

      `;
            if (kind === "scalar" && typeof def !== "object")
              return `// Process the "${name}" prop with scalar defaults
      finalData.${name} =
        typeof data.${name} === undefined
          ? ${mapFieldType(type) === "string" ? `"${def}"` : `${def}`}
          : (data.${name} as ${mapFieldType(type)});

      `;
            if (kind === "scalar" && typeof def === "object") {
              if ("name" in def && def.name === "now")
                return `// Process the "${name}" prop with non-scalar defaults
      finalData.${name} = data.${name} || new Date().toISOString();

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
      for await (const ${singularName} of data.${name}) {
        const key = new Key(${singularName});
        if (!(await this.db.has(key)))
          throw new Error(\`Can not link "\${${singularName}}" as it does not exist in the database.\`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
        if (!oldData.${relationMap[relationName][type]}.includes(newId)) {
          oldData.${relationMap[relationName][type]}.push(newId);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.${name} = data.${name};

      `;
            if (
              relationFromFields.length === 0 &&
              relationToFields.length === 0 &&
              isList &&
              (typeMap[relationName] === "one-to-many" ||
                typeMap[relationName] === "many-to-one")
            )
              return `// Process the ${name} prop: One-to-Many: Many Side
      for await (const ${singularName} of data.${name}) {
        const key = new Key(${singularName});
        if (!(await this.db.has(key)))
          throw new Error(\`Can not link "\${${singularName}}" as it does not exist in the database.\`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
        if (oldData.${relationMap[relationName][type]} !== newId) {
          oldData.${relationMap[relationName][type]} = newId;
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.${name} = data.${name};

      `;
            if (
              relationFromFields.length > 0 &&
              relationToFields.length > 0 &&
              !isList &&
              (typeMap[relationName] === "one-to-many" ||
                typeMap[relationName] === "many-to-one")
            )
              return `// Process the ${name} prop: One-to-Many: One Side
      if (data.${name}) {
        const key = new Key(data.${name});
        if (!(await this.db.has(key)))
          throw new Error(\`Can not link "\${data.${name}}" as it does not exist in the database.\`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
        if (!oldData.${relationMap[relationName][type]}.includes(newId)) {
          oldData.${relationMap[relationName][type]}.push(newId);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.${name} = ${
                isRequired
                  ? `data.${name}`
                  : `data.${name} ? data.${name} : null`
              };

      `;
            if (typeMap[relationName] === "one-to-one")
              return `// Process the ${name} prop: One-to-One
      if (data.${name}) {
        const key = new Key(data.${name});
        if (!(await this.db.has(key)))
          throw new Error(\`Can not link "\${data.${name}}" as it does not exist in the database.\`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
        if (oldData.${relationMap[relationName][type]} !== newId) {
          oldData.${relationMap[relationName][type]} = newId;
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.${name} = ${
                isRequired
                  ? `data.${name}`
                  : `data.${name} ? data.${name} : null`
              };

      `;
            throw new Error(`Can not process field type "${name}"`);
          }
        )
        .join(
          ""
        )}batch.put(new Key(newId), StrToUI8(JSON.stringify(finalData)));
      await batch.commit();
      return finalData;
    }`;
}

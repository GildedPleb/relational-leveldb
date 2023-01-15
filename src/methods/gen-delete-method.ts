import type { ModelType } from "../generator";
import type { RelationMap, TypeMap, SafetyMap } from "./gen-relation-map";

export default function deleteMethod(
  model: ModelType,
  [relationMap, typeMap, safetyMap]: [RelationMap, TypeMap, SafetyMap]
) {
  return `
    // delete method for ${model.name}
    delete: async (id: ${
      model.name
    }Id, opts = { deleteRequiredRelations: false }): Promise<void> => {
      const itemToDelete = await this.findOne(id) as Populated${
        model.name
      } | null;
      if (!itemToDelete) return;
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
      for await (const ${singularName} of itemToDelete.${name}) {
        const key = new Key(${singularName} as string);
        if (await this.db.has(key)) {
          if (!opts.deleteRequiredRelations)
            throw new Error(\`Can not delete "\${id}" as it has a dependent relationship which still exist in the database: "\${${singularName}}" \`)
          await this.${singularName}.delete(${singularName} as ${type}Id, opts)
        }
      }

      `;
            if (
              typeMap[relationName] === "one-to-one" &&
              safetyMap[relationName][type]
            )
              return `// Check the ${name} prop: One-to-One
      if (itemToDelete.${name}) {
        const key = new Key(itemToDelete.${name} as string);
        if (await this.db.has(key)) {
          if (!opts.deleteRequiredRelations)
            throw new Error(\`Can not delete "\${id}" as it has a dependent relationship which still exist in the database: "\${itemToDelete.${name}}" \`)
          await this.${singularName}.delete(itemToDelete.${name} as ${type}Id, opts)
        }
      }`;
          }
        )
        .join("")}
      const batch = this.db.batch();
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
              isList &&
              relationToFields.length !== 0 &&
              relationFromFields.length === 0 &&
              typeMap[relationName] === "many-to-many"
            )
              return `// Process the ${name} prop: Many-to-Many
      for await (const ${singularName} of itemToDelete.${name}) {
        const key = new Key(${singularName} as string);
        if (!(await this.db.has(key)))
          throw new Error(\`Can not unlink "\${${singularName}}" as it does not exist in the database.\`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
        if (oldData.${relationMap[relationName][type]}.includes(id)) {
          oldData.${relationMap[relationName][type]} = oldData.${relationMap[relationName][type]}.filter((i) => i !== id);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
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
      for await (const ${singularName} of itemToDelete.${name}) {
        const key = new Key(${singularName} as string);
        if (!(await this.db.has(key)))
          throw new Error(\`Can not unlink "\${${singularName}}" as it does not exist in the database.\`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
        if (oldData.${relationMap[relationName][type]} === id) {
          oldData.${relationMap[relationName][type]} = null;
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
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
      if (itemToDelete.${name}) {
        const key = new Key(itemToDelete.${name} as string);
        if (!(await this.db.has(key)))
          throw new Error(\`Can not unlink "\${itemToDelete.${name}}" as it does not exist in the database.\`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
        if (oldData.${relationMap[relationName][type]}.includes(id)) {
          oldData.${relationMap[relationName][type]} = oldData.${relationMap[relationName][type]}.filter((i) => i !== id);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }

      `;
            if (typeMap[relationName] === "one-to-one") {
              if (safetyMap[relationName][type]) return "";
              return `// Process the ${name} prop: One-to-One
      if (itemToDelete.${name}) {
        const key = new Key(itemToDelete.${name} as string);
        if (!(await this.db.has(key)))
          throw new Error(\`Can not unlink "\${itemToDelete.${name}}" as it does not exist in the database.\`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as ${type};
        if (oldData.${relationMap[relationName][type]} === id) {
          oldData.${relationMap[relationName][type]} = null;
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }

      `;
            }
            throw new Error(`Can not process field type "${name}"`);
          }
        )
        .join("")}
        batch.delete(new Key(id))
        return batch.commit();
    }`;
}

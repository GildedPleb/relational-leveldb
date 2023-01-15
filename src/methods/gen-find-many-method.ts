import type { ModelType } from "../generator";

export default function findManyMethod(model: ModelType) {
  const modelIdField = model.fields.filter((f) => f.isId).map((f) => f.name)[0];
  return `
    // find many method for ${model.name}
    findMany: async (opts = { depth: 0 }): Promise<Populated${
      model.name
    }[]> => {
      const list = this.db.query({ prefix: "/${model.name}/" })
      const ${model.name.toLowerCase()}s: ${model.name}[] = [];
      for await (const { value } of list) {
        ${model.name.toLowerCase()}s.push(JSON.parse(UI8ToStr(value)) as ${
    model.name
  });
      }
      let populated: Populated${model.name}[] = ${model.name.toLowerCase()}s;
      if (opts.depth > 0) {
        populated = [];
        for await (const ${model.name.toLowerCase()} of ${model.name.toLowerCase()}s) {
          const item = await this.findOne(${model.name.toLowerCase()}.${modelIdField}, {depth: opts.depth});
          populated.push(item as Populated${model.name});
        }
      }
      return populated;
    }`;
}

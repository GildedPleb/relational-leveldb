import type { ModelType } from "../generator";

// TODO: This should def add per-call chaching, cus depths will get goofy
export default function findOneMethod(models: ModelType[]) {
  return `private isValidId(id: unknown): id is ${models
    .map((m) => `${m.name}Id`)
    .join(" | ")} {
    try {
      if (typeof id !== "string") return false;
      if (!validRelation.test(id)) return false;
      const firstIndex = id.indexOf("/");
      const secondIndex = id.indexOf("/", firstIndex + 1);
      const type = id.substring(firstIndex + 1, secondIndex);
      if (!(type in this.idMap)) return false;
      return true;
    } catch {
      return false;
    }
  }

  private getModelFromAddr(str: string) {
    const firstIndex = str.indexOf("/");
    const secondIndex = str.indexOf("/", firstIndex + 1);
    const type = str.substring(firstIndex + 1, secondIndex);
    if (!(type in this.idMap))
      throw new Error(\`id must start with one of \${Object.keys(this.idMap).join(', ')}. Got: "\${str}"\`);
    return type as keyof PopulatedTypes;
  }

  findOne = async <T extends ${models
    .map((m) => `${m.name}Id`)
    .join(
      " | "
    )}>(id: T, opts = { depth: 0 }): Promise<PopulatedTypesId[T] | null> => {
    if (!this.isValidId(id))
      throw new Error(
        \`Must provide a valid key string. Must match /^\\\\/([a-zA-Z0-9]+)\\\\/.+$/ and must start with one of \${Object.keys(this.idMap).join(', ')}. Got: "\${id}". \`
      );
    const modelType = this.getModelFromAddr(id);
    const key = new Key(id);
    try {
      const res = await this.db.get(key);
      const parsed = JSON.parse(UI8ToStr(res));

      const populated = parsed;
      if (opts.depth > 0)
        for await (const [key, value] of Object.entries(parsed)) {
          if (key !== this.idMap[modelType]) {
            if (Array.isArray(value)) {
              const newList = [];
              for await (const v of value) {
                if (this.isValidId(v)) {
                  const item = await this.findOne(v, {depth: opts.depth - 1});
                  newList.push(item);
                } else {
                  newList.push(v);
                }
              }
              populated[key] = newList;
            } else {
              if (this.isValidId(value)) {
                const item = await this.findOne(value, {depth: opts.depth - 1});
                populated[key] = item;
              }
            }
          }
        }
        return populated as PopulatedTypesId[T];
    } catch {
      return null;
    }
  }`;
}

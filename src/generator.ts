import * as fs from "fs";
import * as path from "path";
import PrismaInternals from "@prisma/internals";
const { getDMMF } = PrismaInternals;
import { fileURLToPath } from "url";

import createMethod from "./methods/gen-create-method";
import updateMethod from "./methods/gen-update-method";
import modelDefinitions from "./methods/gen-model-def";
import findOneMethod from "./methods/gen-find-one-method";
import findManyMethod from "./methods/gen-find-many-method";
import deleteMethod from "./methods/gen-delete-method";
import linkDefinitions from "./methods/gen-link-def";
import relationMaper from "./methods/gen-relation-map";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, "../schema.prisma");
const schema = fs.readFileSync(schemaPath, "utf8");

const { datamodel } = await getDMMF({
  datamodel: schema,
});

const models = datamodel.models;
const relationMap = relationMaper(models);

export type ModelType = typeof models[0];

console.log(datamodel);

// generate the code for the API wrapper
const generateCode = (models: ModelType[]) => {
  return `// This file is fully generated, don't bother editing it
import { LevelDatastore } from 'datastore-level';
import { Key } from 'interface-datastore';
import { fromString as StrToUI8, toString as UI8ToStr } from 'uint8arrays';
import { v4 as uuidv4 } from 'uuid';

const validRelation = /^\\/([a-zA-Z0-9]+)\\/.+$/;

// Define the relational types
${linkDefinitions(models)}
// Datamodel Types
${modelDefinitions(models)}
export default class Client {
	private db: LevelDatastore;
  private idMap: { [x: string]: string };

	constructor() {
	  this.db = new LevelDatastore("${process.env["DATABASE_URL"] || "./mydb"}");
    this.idMap = {
      ${models.map(
        (model) =>
          `${model.name}: "${
            model.fields.filter((field) => field.isId)[0].name
          }"`
      ).join(`,
      `)}
    }
  }
  init = async () => {
    await this.db.open();
  }

  ${findOneMethod(models)}

  ${models
    .map(
      (model) => `
  ${model.name.toLowerCase()} = {
    ${createMethod(model, relationMap)},
    ${findManyMethod(model)},
    ${updateMethod(model, relationMap)}
    ${deleteMethod(model, relationMap)},
  }
      `
    )
    .join("")}
}
`;
};

const outputPath = path.join(__dirname, "../generated-output-code.ts");
fs.writeFileSync(outputPath, generateCode(models), "utf8");

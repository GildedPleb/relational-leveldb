import { pascalCase } from "change-case";
import type { ModelType } from "../generator";

export default function modelDefinitions(models: ModelType[]) {
  return `type LinkMany<T> = {
  link?: T[];
  unlink?: T[];
}
${models
  .map(
    (field) => `type ${pascalCase(field.name)}Id = \`/${pascalCase(
      field.name
    )}/\${string}\`;
`
  )
  .join("")}
`;
}

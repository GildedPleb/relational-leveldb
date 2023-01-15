// This file is fully generated, don't bother editing it
import { LevelDatastore } from 'datastore-level';
import { Key } from 'interface-datastore';
import { fromString as StrToUI8, toString as UI8ToStr } from 'uint8arrays';
import { v4 as uuidv4 } from 'uuid';

const validRelation = /^\/([a-zA-Z0-9]+)\/.+$/;

// Define the relational types
type LinkMany<T> = {
  link?: T[];
  unlink?: T[];
}
type RecipeId = `/Recipe/${string}`;
type IngredientId = `/Ingredient/${string}`;
type AuthorId = `/Author/${string}`;
type PublisherId = `/Publisher/${string}`;


// Datamodel Types
type Recipe = {
  id: RecipeId;
  name: string;
  ingredients: IngredientId[];
  author: AuthorId;
  instructions: string | null;
  createdAt: string;
}
type CreateRecipe = {
  id?: RecipeId;
  name: string;
  ingredients: IngredientId[];
  author: AuthorId;
  instructions?: string;
  createdAt?: string;
}
type UpdateRecipe = {
  id: RecipeId;
  name?: string;
  ingredients?: LinkMany<IngredientId>;
  author?: AuthorId;
  instructions?: string | null;
  createdAt?: string;
}
type PopulatedRecipe = {
  id: RecipeId;
  name: string;
  ingredients: IngredientId[] | PopulatedIngredient[];
  author: AuthorId | Author;
  instructions: string | null;
  createdAt: string;
}
type Ingredient = {
  id: IngredientId;
  name: string;
  comment: string;
  dateAddedToPantry: string;
  dateRemoved: string | null;
  count: number;
  quantity: number;
  recipies: RecipeId[];
}
type CreateIngredient = {
  id?: IngredientId;
  name: string;
  comment?: string;
  dateAddedToPantry: string;
  dateRemoved?: string;
  count: number;
  quantity: number;
  recipies: RecipeId[];
}
type UpdateIngredient = {
  id: IngredientId;
  name?: string;
  comment?: string;
  dateAddedToPantry?: string;
  dateRemoved?: string | null;
  count?: number;
  quantity?: number;
  recipies?: LinkMany<RecipeId>;
}
type PopulatedIngredient = {
  id: IngredientId;
  name: string;
  comment: string;
  dateAddedToPantry: string;
  dateRemoved: string | null;
  count: number;
  quantity: number;
  recipies: RecipeId[] | PopulatedRecipe[];
}
type Author = {
  id: AuthorId;
  name: string;
  Recipes: RecipeId[];
  selfPublisher: PublisherId;
  publishers: PublisherId[];
}
type CreateAuthor = {
  id?: AuthorId;
  name: string;
  Recipes: RecipeId[];
  selfPublisher: PublisherId;
  publishers: PublisherId[];
}
type UpdateAuthor = {
  id: AuthorId;
  name?: string;
  Recipes?: LinkMany<RecipeId>;
  selfPublisher?: PublisherId;
  publishers?: LinkMany<PublisherId>;
}
type PopulatedAuthor = {
  id: AuthorId;
  name: string;
  Recipes: RecipeId[] | PopulatedRecipe[];
  selfPublisher: PublisherId | Publisher;
  publishers: PublisherId[] | PopulatedPublisher[];
}
type Publisher = {
  id: PublisherId;
  author: AuthorId | null;
  authors: AuthorId[];
}
type CreatePublisher = {
  id: PublisherId;
  author?: AuthorId;
  authors: AuthorId[];
}
type UpdatePublisher = {
  id: PublisherId;
  author?: AuthorId | null;
  authors?: LinkMany<AuthorId>;
}
type PopulatedPublisher = {
  id: PublisherId;
  author: AuthorId | Author | null;
  authors: AuthorId[] | PopulatedAuthor[];
}

type PopulatedTypes = {
  Recipe: PopulatedRecipe;
  Ingredient: PopulatedIngredient;
  Author: PopulatedAuthor;
  Publisher: PopulatedPublisher;
};

type PopulatedTypesId = {
  [x: RecipeId]: PopulatedRecipe;
  [x: IngredientId]: PopulatedIngredient;
  [x: AuthorId]: PopulatedAuthor;
  [x: PublisherId]: PopulatedPublisher;
};

export default class Client {
	private db: LevelDatastore;
  private idMap: { [x: string]: string };

	constructor() {
	  this.db = new LevelDatastore("./mydb");
    this.idMap = {
      Recipe: "id",
      Ingredient: "id",
      Author: "id",
      Publisher: "id"
    }
  }
  init = async () => {
    await this.db.open();
  }

  private isValidId(id: unknown): id is RecipeId | IngredientId | AuthorId | PublisherId {
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
      throw new Error(`id must start with one of ${Object.keys(this.idMap).join(', ')}. Got: "${str}"`);
    return type as keyof PopulatedTypes;
  }

  findOne = async <T extends RecipeId | IngredientId | AuthorId | PublisherId>(id: T, opts = { depth: 0 }): Promise<PopulatedTypesId[T] | null> => {
    if (!this.isValidId(id))
      throw new Error(
        `Must provide a valid key string. Must match /^\\/([a-zA-Z0-9]+)\\/.+$/ and must start with one of ${Object.keys(this.idMap).join(', ')}. Got: "${id}". `
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
  }

  
  recipe = {
    // Create method for Recipe
    create: async (data: CreateRecipe): Promise<Recipe> => {
      const finalData = {} as Recipe;
      
      // Evaluate Unique Fields: [name,instructions]
      const allRecipes = await this.recipe.findMany();
      for (const uniqueField of [["name", "instructions"]] as (keyof PopulatedRecipe)[][]) {
        const newRecord = uniqueField.map((f) => f in data ? data[f] : "").join("-");
        for (const recipe of allRecipes) {
          const existingRecord = uniqueField.map((f) => recipe[f] !== null ? recipe[f] : "null" ).join("-");
          if (newRecord === existingRecord)
            throw new Error(`Must provide unique values to the "${uniqueField.join(", ")}" key(s) when creating a new Recipe. Got: ${newRecord}`)
        }
      }
      
      // Process the ID
      const newId = data.id || ("/Recipe/" +  uuidv4()) as RecipeId;
      if (!validRelation.test(newId))
        throw new Error(
          `Must give valid value to "id" prop. Can not create a new Recipe with key id: "${newId}", must match /^\\/([a-zA-Z0-9]+)\\/.+$/ `
        );

      if (await this.db.has(new Key(newId)))
        throw new Error(
          `Must give unique value to "id" prop. Can not create a new Recipe with key id: "${newId}"`
        );
      finalData.id = newId;
      const batch = this.db.batch();
      // Process the required "name" prop with no defaults
      finalData.name = data.name;

      // Process the ingredients prop: Many-to-Many
      for await (const ingredient of data.ingredients) {
        const key = new Key(ingredient);
        if (!(await this.db.has(key)))
          throw new Error(`Can not link "${ingredient}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Ingredient;
        if (!oldData.recipies.includes(newId)) {
          oldData.recipies.push(newId);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.ingredients = data.ingredients;

      // Process the author prop: One-to-Many: One Side
      if (data.author) {
        const key = new Key(data.author);
        if (!(await this.db.has(key)))
          throw new Error(`Can not link "${data.author}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Author;
        if (!oldData.Recipes.includes(newId)) {
          oldData.Recipes.push(newId);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.author = data.author;

      // Process the not-required "instructions" prop with no defaults
      finalData.instructions = data.instructions ? data.instructions : null;

      // Process the "createdAt" prop with non-scalar defaults
      finalData.createdAt = data.createdAt || new Date().toISOString();

      batch.put(new Key(newId), StrToUI8(JSON.stringify(finalData)));
      await batch.commit();
      return finalData;
    },
    
    // find many method for Recipe
    findMany: async (opts = { depth: 0 }): Promise<PopulatedRecipe[]> => {
      const list = this.db.query({ prefix: "/Recipe/" })
      const recipes: Recipe[] = [];
      for await (const { value } of list) {
        recipes.push(JSON.parse(UI8ToStr(value)) as Recipe);
      }
      let populated: PopulatedRecipe[] = recipes;
      if (opts.depth > 0) {
        populated = [];
        for await (const recipe of recipes) {
          const item = await this.findOne(recipe.id, {depth: opts.depth});
          populated.push(item as PopulatedRecipe);
        }
      }
      return populated;
    },
    
    // update method for Recipe
    update: async (data: UpdateRecipe): Promise<Recipe> => {
      const oldData = await this.findOne(data.id);
      if (!oldData)
        throw new Error(
          `Can not update ${data.id}, as it does not exist in the database. `
        );
      const finalData = oldData as Recipe;
      
      // Evaluate Unique Fields: [name,instructions]
      const allRecipes = await this.recipe.findMany();
      for (const uniqueField of [["name", "instructions"]] as (keyof PopulatedRecipe)[][]) {
        const newRecord = uniqueField.map((f) => f in data ? data[f] : "").join("-");
        for (const recipe of allRecipes) {
          const existingRecord = uniqueField.map((f) => recipe[f] !== null ? recipe[f] : "null" ).join("-");
          if (newRecord === existingRecord)
            throw new Error(`Must provide unique values to the "${uniqueField.join(", ")}" key(s) when updating a(n) Recipe. Got: ${newRecord}`)
        }
      }
      
      
      const batch = this.db.batch();
      // Process the required "name" prop with no defaults
      if ("name" in data && data.name)
        finalData.name = data.name;

      // Process the ingredients prop: Many-to-Many
      if ("ingredients" in data && data.ingredients) {
        let interim = [...oldData.ingredients as IngredientId[]];
        if (data.ingredients.unlink) {
          for await (const ingredient of data.ingredients.unlink) {
            const key = new Key(ingredient);
            if (!(await this.db.has(key)))
              throw new Error(`Can not unlink "${ingredient}" as it does not exist in the database.`)
            const oldIngredient = JSON.parse(UI8ToStr(await this.db.get(key))) as Ingredient;
            if (oldIngredient.recipies.includes(data.id)) {
              oldIngredient.recipies = oldIngredient.recipies.filter((i) => i !== data.id);
              batch.put(key, StrToUI8(JSON.stringify(oldIngredient)));
            }
          }
          for (const ingredient of data.ingredients.unlink) {
            interim = interim.filter((i) => i !== ingredient);
          }
        }
        if (data.ingredients.link) {
          for await (const ingredient of data.ingredients.link) {
            const key = new Key(ingredient);
            if (!(await this.db.has(key)))
              throw new Error(`Can not link "${ingredient}" as it does not exist in the database.`)
            const oldIngredient = JSON.parse(UI8ToStr(await this.db.get(key))) as Ingredient;
            if (!oldIngredient.recipies.includes(data.id)) {
              oldIngredient.recipies.push(data.id);
              batch.put(key, StrToUI8(JSON.stringify(oldIngredient)));
            }
          }
          interim = [...interim, ...data.ingredients.link];
        }
        finalData.ingredients = interim.filter((v, i, arr) => arr.indexOf(v) === i);
      }

      // Process the author prop: One-to-Many: One Side
      if (data.author) {
        const prevKey = new Key(oldData.author as string);
        if (!(await this.db.has(prevKey)))
          throw new Error(`Can not unlink "${oldData.author}" as it does not exist in the database.`)
        const key = new Key(data.author);
        if (!(await this.db.has(key)))
          throw new Error(`Can not link "${data.author}" as it does not exist in the database.`)
        const prevAuthor = JSON.parse(UI8ToStr(await this.db.get(prevKey))) as Author;
        if (prevAuthor.Recipes.includes(data.id)) {
          prevAuthor.Recipes = prevAuthor.Recipes.filter((i) => i !== data.id);
          batch.put(prevKey, StrToUI8(JSON.stringify(prevAuthor)));
        }
        const oldAuthor = JSON.parse(UI8ToStr(await this.db.get(key))) as Author;
        if (!oldAuthor.Recipes.includes(data.id)) {
          oldAuthor.Recipes.push(data.id);
          batch.put(key, StrToUI8(JSON.stringify(oldAuthor)));
        }
        finalData.author = data.author;
      }

      // Process the not-required "instructions" prop with no defaults
      if ("instructions" in data && data.instructions !== undefined)
        finalData.instructions = data.instructions;

      // Process the "createdAt" prop with non-scalar defaults
      if ("createdAt" in data && data.createdAt)
        finalData.createdAt = data.createdAt;

      batch.put(new Key(data.id), StrToUI8(JSON.stringify(finalData)));
      await batch.commit();
      return finalData;
  	},
    
    // delete method for Recipe
    delete: async (id: RecipeId, opts = { deleteRequiredRelations: false }): Promise<void> => {
      const itemToDelete = await this.findOne(id) as PopulatedRecipe | null;
      if (!itemToDelete) return;
      
      const batch = this.db.batch();
      // Process the ingredients prop: Many-to-Many
      for await (const ingredient of itemToDelete.ingredients) {
        const key = new Key(ingredient as string);
        if (!(await this.db.has(key)))
          throw new Error(`Can not unlink "${ingredient}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Ingredient;
        if (oldData.recipies.includes(id)) {
          oldData.recipies = oldData.recipies.filter((i) => i !== id);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }

      // Process the author prop: One-to-Many: One Side
      if (itemToDelete.author) {
        const key = new Key(itemToDelete.author as string);
        if (!(await this.db.has(key)))
          throw new Error(`Can not unlink "${itemToDelete.author}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Author;
        if (oldData.Recipes.includes(id)) {
          oldData.Recipes = oldData.Recipes.filter((i) => i !== id);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }

      
        batch.delete(new Key(id))
        return batch.commit();
    },
  }
      
  ingredient = {
    // Create method for Ingredient
    create: async (data: CreateIngredient): Promise<Ingredient> => {
      const finalData = {} as Ingredient;
      
      // Evaluate Unique Fields: [dateRemoved]
      const allIngredients = await this.ingredient.findMany();
      for (const uniqueField of [["dateRemoved"]] as (keyof PopulatedIngredient)[][]) {
        const newRecord = uniqueField.map((f) => f in data ? data[f] : "").join("-");
        for (const ingredient of allIngredients) {
          const existingRecord = uniqueField.map((f) => ingredient[f] !== null ? ingredient[f] : "null" ).join("-");
          if (newRecord === existingRecord)
            throw new Error(`Must provide unique values to the "${uniqueField.join(", ")}" key(s) when creating a new Ingredient. Got: ${newRecord}`)
        }
      }
      
      // Process the ID
      const newId = data.id || ("/Ingredient/" +  uuidv4()) as IngredientId;
      if (!validRelation.test(newId))
        throw new Error(
          `Must give valid value to "id" prop. Can not create a new Ingredient with key id: "${newId}", must match /^\\/([a-zA-Z0-9]+)\\/.+$/ `
        );

      if (await this.db.has(new Key(newId)))
        throw new Error(
          `Must give unique value to "id" prop. Can not create a new Ingredient with key id: "${newId}"`
        );
      finalData.id = newId;
      const batch = this.db.batch();
      // Process the required "name" prop with no defaults
      finalData.name = data.name;

      // Process the "comment" prop with scalar defaults
      finalData.comment =
        typeof data.comment === undefined
          ? "keep it cold"
          : (data.comment as string);

      // Process the required "dateAddedToPantry" prop with no defaults
      finalData.dateAddedToPantry = data.dateAddedToPantry;

      // Process the not-required "dateRemoved" prop with no defaults
      finalData.dateRemoved = data.dateRemoved ? data.dateRemoved : null;

      // Process the required "count" prop with no defaults
      finalData.count = data.count;

      // Process the required "quantity" prop with no defaults
      finalData.quantity = data.quantity;

      // Process the recipies prop: Many-to-Many
      for await (const recipe of data.recipies) {
        const key = new Key(recipe);
        if (!(await this.db.has(key)))
          throw new Error(`Can not link "${recipe}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Recipe;
        if (!oldData.ingredients.includes(newId)) {
          oldData.ingredients.push(newId);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.recipies = data.recipies;

      batch.put(new Key(newId), StrToUI8(JSON.stringify(finalData)));
      await batch.commit();
      return finalData;
    },
    
    // find many method for Ingredient
    findMany: async (opts = { depth: 0 }): Promise<PopulatedIngredient[]> => {
      const list = this.db.query({ prefix: "/Ingredient/" })
      const ingredients: Ingredient[] = [];
      for await (const { value } of list) {
        ingredients.push(JSON.parse(UI8ToStr(value)) as Ingredient);
      }
      let populated: PopulatedIngredient[] = ingredients;
      if (opts.depth > 0) {
        populated = [];
        for await (const ingredient of ingredients) {
          const item = await this.findOne(ingredient.id, {depth: opts.depth});
          populated.push(item as PopulatedIngredient);
        }
      }
      return populated;
    },
    
    // update method for Ingredient
    update: async (data: UpdateIngredient): Promise<Ingredient> => {
      const oldData = await this.findOne(data.id);
      if (!oldData)
        throw new Error(
          `Can not update ${data.id}, as it does not exist in the database. `
        );
      const finalData = oldData as Ingredient;
      
      // Evaluate Unique Fields: [dateRemoved]
      const allIngredients = await this.ingredient.findMany();
      for (const uniqueField of [["dateRemoved"]] as (keyof PopulatedIngredient)[][]) {
        const newRecord = uniqueField.map((f) => f in data ? data[f] : "").join("-");
        for (const ingredient of allIngredients) {
          const existingRecord = uniqueField.map((f) => ingredient[f] !== null ? ingredient[f] : "null" ).join("-");
          if (newRecord === existingRecord)
            throw new Error(`Must provide unique values to the "${uniqueField.join(", ")}" key(s) when updating a(n) Ingredient. Got: ${newRecord}`)
        }
      }
      
      
      const batch = this.db.batch();
      // Process the required "name" prop with no defaults
      if ("name" in data && data.name)
        finalData.name = data.name;

      // Process the "comment" prop with scalar defaults
      if ("comment" in data && data.comment)
        finalData.comment = data.comment;

      // Process the required "dateAddedToPantry" prop with no defaults
      if ("dateAddedToPantry" in data && data.dateAddedToPantry)
        finalData.dateAddedToPantry = data.dateAddedToPantry;

      // Process the not-required "dateRemoved" prop with no defaults
      if ("dateRemoved" in data && data.dateRemoved !== undefined)
        finalData.dateRemoved = data.dateRemoved;

      // Process the required "count" prop with no defaults
      if ("count" in data && data.count)
        finalData.count = data.count;

      // Process the required "quantity" prop with no defaults
      if ("quantity" in data && data.quantity)
        finalData.quantity = data.quantity;

      // Process the recipies prop: Many-to-Many
      if ("recipies" in data && data.recipies) {
        let interim = [...oldData.recipies as RecipeId[]];
        if (data.recipies.unlink) {
          for await (const recipe of data.recipies.unlink) {
            const key = new Key(recipe);
            if (!(await this.db.has(key)))
              throw new Error(`Can not unlink "${recipe}" as it does not exist in the database.`)
            const oldRecipe = JSON.parse(UI8ToStr(await this.db.get(key))) as Recipe;
            if (oldRecipe.ingredients.includes(data.id)) {
              oldRecipe.ingredients = oldRecipe.ingredients.filter((i) => i !== data.id);
              batch.put(key, StrToUI8(JSON.stringify(oldRecipe)));
            }
          }
          for (const recipe of data.recipies.unlink) {
            interim = interim.filter((i) => i !== recipe);
          }
        }
        if (data.recipies.link) {
          for await (const recipe of data.recipies.link) {
            const key = new Key(recipe);
            if (!(await this.db.has(key)))
              throw new Error(`Can not link "${recipe}" as it does not exist in the database.`)
            const oldRecipe = JSON.parse(UI8ToStr(await this.db.get(key))) as Recipe;
            if (!oldRecipe.ingredients.includes(data.id)) {
              oldRecipe.ingredients.push(data.id);
              batch.put(key, StrToUI8(JSON.stringify(oldRecipe)));
            }
          }
          interim = [...interim, ...data.recipies.link];
        }
        finalData.recipies = interim.filter((v, i, arr) => arr.indexOf(v) === i);
      }

      batch.put(new Key(data.id), StrToUI8(JSON.stringify(finalData)));
      await batch.commit();
      return finalData;
  	},
    
    // delete method for Ingredient
    delete: async (id: IngredientId, opts = { deleteRequiredRelations: false }): Promise<void> => {
      const itemToDelete = await this.findOne(id) as PopulatedIngredient | null;
      if (!itemToDelete) return;
      
      const batch = this.db.batch();
      // Process the recipies prop: Many-to-Many
      for await (const recipe of itemToDelete.recipies) {
        const key = new Key(recipe as string);
        if (!(await this.db.has(key)))
          throw new Error(`Can not unlink "${recipe}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Recipe;
        if (oldData.ingredients.includes(id)) {
          oldData.ingredients = oldData.ingredients.filter((i) => i !== id);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }

      
        batch.delete(new Key(id))
        return batch.commit();
    },
  }
      
  author = {
    // Create method for Author
    create: async (data: CreateAuthor): Promise<Author> => {
      const finalData = {} as Author;
      
      // Evaluate Unique Fields: [name]
      const allAuthors = await this.author.findMany();
      for (const uniqueField of [["name"]] as (keyof PopulatedAuthor)[][]) {
        const newRecord = uniqueField.map((f) => f in data ? data[f] : "").join("-");
        for (const author of allAuthors) {
          const existingRecord = uniqueField.map((f) => author[f] !== null ? author[f] : "null" ).join("-");
          if (newRecord === existingRecord)
            throw new Error(`Must provide unique values to the "${uniqueField.join(", ")}" key(s) when creating a new Author. Got: ${newRecord}`)
        }
      }
      
      // Process the ID
      const newId = data.id || ("/Author/" +  uuidv4()) as AuthorId;
      if (!validRelation.test(newId))
        throw new Error(
          `Must give valid value to "id" prop. Can not create a new Author with key id: "${newId}", must match /^\\/([a-zA-Z0-9]+)\\/.+$/ `
        );

      if (await this.db.has(new Key(newId)))
        throw new Error(
          `Must give unique value to "id" prop. Can not create a new Author with key id: "${newId}"`
        );
      finalData.id = newId;
      const batch = this.db.batch();
      // Process the required "name" prop with no defaults
      finalData.name = data.name;

      // Process the Recipes prop: One-to-Many: Many Side
      for await (const recipe of data.Recipes) {
        const key = new Key(recipe);
        if (!(await this.db.has(key)))
          throw new Error(`Can not link "${recipe}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Recipe;
        if (oldData.author !== newId) {
          oldData.author = newId;
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.Recipes = data.Recipes;

      // Process the selfPublisher prop: One-to-One
      if (data.selfPublisher) {
        const key = new Key(data.selfPublisher);
        if (!(await this.db.has(key)))
          throw new Error(`Can not link "${data.selfPublisher}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Publisher;
        if (oldData.author !== newId) {
          oldData.author = newId;
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.selfPublisher = data.selfPublisher;

      // Process the publishers prop: Many-to-Many
      for await (const publisher of data.publishers) {
        const key = new Key(publisher);
        if (!(await this.db.has(key)))
          throw new Error(`Can not link "${publisher}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Publisher;
        if (!oldData.authors.includes(newId)) {
          oldData.authors.push(newId);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.publishers = data.publishers;

      batch.put(new Key(newId), StrToUI8(JSON.stringify(finalData)));
      await batch.commit();
      return finalData;
    },
    
    // find many method for Author
    findMany: async (opts = { depth: 0 }): Promise<PopulatedAuthor[]> => {
      const list = this.db.query({ prefix: "/Author/" })
      const authors: Author[] = [];
      for await (const { value } of list) {
        authors.push(JSON.parse(UI8ToStr(value)) as Author);
      }
      let populated: PopulatedAuthor[] = authors;
      if (opts.depth > 0) {
        populated = [];
        for await (const author of authors) {
          const item = await this.findOne(author.id, {depth: opts.depth});
          populated.push(item as PopulatedAuthor);
        }
      }
      return populated;
    },
    
    // update method for Author
    update: async (data: UpdateAuthor): Promise<Author> => {
      const oldData = await this.findOne(data.id);
      if (!oldData)
        throw new Error(
          `Can not update ${data.id}, as it does not exist in the database. `
        );
      const finalData = oldData as Author;
      
      // Evaluate Unique Fields: [name]
      const allAuthors = await this.author.findMany();
      for (const uniqueField of [["name"]] as (keyof PopulatedAuthor)[][]) {
        const newRecord = uniqueField.map((f) => f in data ? data[f] : "").join("-");
        for (const author of allAuthors) {
          const existingRecord = uniqueField.map((f) => author[f] !== null ? author[f] : "null" ).join("-");
          if (newRecord === existingRecord)
            throw new Error(`Must provide unique values to the "${uniqueField.join(", ")}" key(s) when updating a(n) Author. Got: ${newRecord}`)
        }
      }
      
      // Check the Recipes prop: One-to-Many: Many Side
      if ("Recipes" in data && data.Recipes && data.Recipes.unlink) {
        for await (const recipe of data.Recipes.unlink) {
          const key = new Key(recipe as string);
          if (await this.db.has(key))
            throw new Error(`Can not unlink "${recipe}" from "${data.id}" by updating "${data.id}" as "${recipe}" has a dependent/required relationship. You must first update "${recipe}" to point to a differnt Author. `)
        }
      }
      
      const batch = this.db.batch();
      // Process the required "name" prop with no defaults
      if ("name" in data && data.name)
        finalData.name = data.name;

      // Process the selfPublisher prop: One-to-One
      if ("selfPublisher" in data && data.selfPublisher) {
        const key = new Key(data.selfPublisher);
        if (!(await this.db.has(key)))
          throw new Error(`Can not link "${data.selfPublisher}" as it does not exist in the database.`)
        const oldKey = new Key(oldData.selfPublisher as PublisherId);
        const oldPublisher = JSON.parse(UI8ToStr(await this.db.get(oldKey))) as Publisher;
        if (oldPublisher.author === data.id) {
          oldPublisher.author = null;
          batch.put(oldKey, StrToUI8(JSON.stringify(oldPublisher)));
        } else {
          throw new Error(`Can not unlink "${data.selfPublisher}" as it is already linked to another author: "${oldPublisher.author}". First, link it to author then unlink it with "${data.id}" from here.`)
        }
        const newPublisher = JSON.parse(UI8ToStr(await this.db.get(key))) as Publisher;
        if (newPublisher.author === null) {
          newPublisher.author = data.id;
          batch.put(key, StrToUI8(JSON.stringify(newPublisher)));
        } else {
          throw new Error(`Can not link "${data.selfPublisher}" as it is already linked to another author: "${newPublisher.author}". First, unlink it from that author then link it with "${data.id}".`)
        }

        finalData.selfPublisher = data.selfPublisher;
      }

      // Process the publishers prop: Many-to-Many
      if ("publishers" in data && data.publishers) {
        let interim = [...oldData.publishers as PublisherId[]];
        if (data.publishers.unlink) {
          for await (const publisher of data.publishers.unlink) {
            const key = new Key(publisher);
            if (!(await this.db.has(key)))
              throw new Error(`Can not unlink "${publisher}" as it does not exist in the database.`)
            const oldPublisher = JSON.parse(UI8ToStr(await this.db.get(key))) as Publisher;
            if (oldPublisher.authors.includes(data.id)) {
              oldPublisher.authors = oldPublisher.authors.filter((i) => i !== data.id);
              batch.put(key, StrToUI8(JSON.stringify(oldPublisher)));
            }
          }
          for (const publisher of data.publishers.unlink) {
            interim = interim.filter((i) => i !== publisher);
          }
        }
        if (data.publishers.link) {
          for await (const publisher of data.publishers.link) {
            const key = new Key(publisher);
            if (!(await this.db.has(key)))
              throw new Error(`Can not link "${publisher}" as it does not exist in the database.`)
            const oldPublisher = JSON.parse(UI8ToStr(await this.db.get(key))) as Publisher;
            if (!oldPublisher.authors.includes(data.id)) {
              oldPublisher.authors.push(data.id);
              batch.put(key, StrToUI8(JSON.stringify(oldPublisher)));
            }
          }
          interim = [...interim, ...data.publishers.link];
        }
        finalData.publishers = interim.filter((v, i, arr) => arr.indexOf(v) === i);
      }

      batch.put(new Key(data.id), StrToUI8(JSON.stringify(finalData)));
      await batch.commit();
      return finalData;
  	},
    
    // delete method for Author
    delete: async (id: AuthorId, opts = { deleteRequiredRelations: false }): Promise<void> => {
      const itemToDelete = await this.findOne(id) as PopulatedAuthor | null;
      if (!itemToDelete) return;
      // Check the Recipes prop: One-to-Many: Many Side
      for await (const recipe of itemToDelete.Recipes) {
        const key = new Key(recipe as string);
        if (await this.db.has(key)) {
          if (!opts.deleteRequiredRelations)
            throw new Error(`Can not delete "${id}" as it has a dependent relationship which still exist in the database: "${recipe}" `)
          await this.recipe.delete(recipe as RecipeId, opts)
        }
      }

      
      const batch = this.db.batch();
      // Process the selfPublisher prop: One-to-One
      if (itemToDelete.selfPublisher) {
        const key = new Key(itemToDelete.selfPublisher as string);
        if (!(await this.db.has(key)))
          throw new Error(`Can not unlink "${itemToDelete.selfPublisher}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Publisher;
        if (oldData.author === id) {
          oldData.author = null;
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }

      // Process the publishers prop: Many-to-Many
      for await (const publisher of itemToDelete.publishers) {
        const key = new Key(publisher as string);
        if (!(await this.db.has(key)))
          throw new Error(`Can not unlink "${publisher}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Publisher;
        if (oldData.authors.includes(id)) {
          oldData.authors = oldData.authors.filter((i) => i !== id);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }

      
        batch.delete(new Key(id))
        return batch.commit();
    },
  }
      
  publisher = {
    // Create method for Publisher
    create: async (data: CreatePublisher): Promise<Publisher> => {
      const finalData = {} as Publisher;
      
      // Process the ID
      const newId = data.id || ("/Publisher/" +  uuidv4()) as PublisherId;
      if (!validRelation.test(newId))
        throw new Error(
          `Must give valid value to "id" prop. Can not create a new Publisher with key id: "${newId}", must match /^\\/([a-zA-Z0-9]+)\\/.+$/ `
        );

      if (await this.db.has(new Key(newId)))
        throw new Error(
          `Must give unique value to "id" prop. Can not create a new Publisher with key id: "${newId}"`
        );
      finalData.id = newId;
      const batch = this.db.batch();
      // Process the author prop: One-to-One
      if (data.author) {
        const key = new Key(data.author);
        if (!(await this.db.has(key)))
          throw new Error(`Can not link "${data.author}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Author;
        if (oldData.selfPublisher !== newId) {
          oldData.selfPublisher = newId;
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.author = data.author ? data.author : null;

      // Process the authors prop: Many-to-Many
      for await (const author of data.authors) {
        const key = new Key(author);
        if (!(await this.db.has(key)))
          throw new Error(`Can not link "${author}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Author;
        if (!oldData.publishers.includes(newId)) {
          oldData.publishers.push(newId);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }
      finalData.authors = data.authors;

      batch.put(new Key(newId), StrToUI8(JSON.stringify(finalData)));
      await batch.commit();
      return finalData;
    },
    
    // find many method for Publisher
    findMany: async (opts = { depth: 0 }): Promise<PopulatedPublisher[]> => {
      const list = this.db.query({ prefix: "/Publisher/" })
      const publishers: Publisher[] = [];
      for await (const { value } of list) {
        publishers.push(JSON.parse(UI8ToStr(value)) as Publisher);
      }
      let populated: PopulatedPublisher[] = publishers;
      if (opts.depth > 0) {
        populated = [];
        for await (const publisher of publishers) {
          const item = await this.findOne(publisher.id, {depth: opts.depth});
          populated.push(item as PopulatedPublisher);
        }
      }
      return populated;
    },
    
    // update method for Publisher
    update: async (data: UpdatePublisher): Promise<Publisher> => {
      const oldData = await this.findOne(data.id);
      if (!oldData)
        throw new Error(
          `Can not update ${data.id}, as it does not exist in the database. `
        );
      const finalData = oldData as Publisher;
      
      // Check the author prop: One-to-One
      if ("author" in data && data.author) {
        const key = new Key(data.author as string);
        if (await this.db.has(key))
          throw new Error(`Can not change the link to "${data.author}" from "${data.id}" by updating "${data.id}" as "${data.author}" has a dependent/required relationship. You must first update "${data.author}" to point to a differnt Publisher. `)
      }
      const batch = this.db.batch();
      // Process the authors prop: Many-to-Many
      if ("authors" in data && data.authors) {
        let interim = [...oldData.authors as AuthorId[]];
        if (data.authors.unlink) {
          for await (const author of data.authors.unlink) {
            const key = new Key(author);
            if (!(await this.db.has(key)))
              throw new Error(`Can not unlink "${author}" as it does not exist in the database.`)
            const oldAuthor = JSON.parse(UI8ToStr(await this.db.get(key))) as Author;
            if (oldAuthor.publishers.includes(data.id)) {
              oldAuthor.publishers = oldAuthor.publishers.filter((i) => i !== data.id);
              batch.put(key, StrToUI8(JSON.stringify(oldAuthor)));
            }
          }
          for (const author of data.authors.unlink) {
            interim = interim.filter((i) => i !== author);
          }
        }
        if (data.authors.link) {
          for await (const author of data.authors.link) {
            const key = new Key(author);
            if (!(await this.db.has(key)))
              throw new Error(`Can not link "${author}" as it does not exist in the database.`)
            const oldAuthor = JSON.parse(UI8ToStr(await this.db.get(key))) as Author;
            if (!oldAuthor.publishers.includes(data.id)) {
              oldAuthor.publishers.push(data.id);
              batch.put(key, StrToUI8(JSON.stringify(oldAuthor)));
            }
          }
          interim = [...interim, ...data.authors.link];
        }
        finalData.authors = interim.filter((v, i, arr) => arr.indexOf(v) === i);
      }

      batch.put(new Key(data.id), StrToUI8(JSON.stringify(finalData)));
      await batch.commit();
      return finalData;
  	},
    
    // delete method for Publisher
    delete: async (id: PublisherId, opts = { deleteRequiredRelations: false }): Promise<void> => {
      const itemToDelete = await this.findOne(id) as PopulatedPublisher | null;
      if (!itemToDelete) return;
      // Check the author prop: One-to-One
      if (itemToDelete.author) {
        const key = new Key(itemToDelete.author as string);
        if (await this.db.has(key)) {
          if (!opts.deleteRequiredRelations)
            throw new Error(`Can not delete "${id}" as it has a dependent relationship which still exist in the database: "${itemToDelete.author}" `)
          await this.author.delete(itemToDelete.author as AuthorId, opts)
        }
      }
      const batch = this.db.batch();
      // Process the authors prop: Many-to-Many
      for await (const author of itemToDelete.authors) {
        const key = new Key(author as string);
        if (!(await this.db.has(key)))
          throw new Error(`Can not unlink "${author}" as it does not exist in the database.`)
        const oldData = JSON.parse(UI8ToStr(await this.db.get(key))) as Author;
        if (oldData.publishers.includes(id)) {
          oldData.publishers = oldData.publishers.filter((i) => i !== id);
          batch.put(key, StrToUI8(JSON.stringify(oldData)));
        }
      }

      
        batch.delete(new Key(id))
        return batch.commit();
    },
  }
      
}

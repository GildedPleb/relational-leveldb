import Client from "./generated-output-code";

const client = new Client();
await client.init();

const publisher = await client.publisher.create({
  id: "/Publisher/ALICE PUBLISHER",
  authors: [],
});
const author = await client.author.create({
  name: "ALICE",
  Recipes: [],
  selfPublisher: publisher.id,
  publishers: [],
});
const ingredient1 = await client.ingredient.create({
  name: "water",
  recipies: [],
  dateAddedToPantry: new Date().toISOString(),
  count: 0,
  quantity: 40,
});
const ingredient2 = await client.ingredient.create({
  name: "lemons",
  dateAddedToPantry: new Date().toISOString(),
  count: 0,
  quantity: 40,
  recipies: [],
});
await client.recipe.create({
  name: "lemonaid",
  ingredients: [ingredient2.id, ingredient1.id],
  author: author.id,
});

const recipes = await client.recipe.findMany({ depth: 2 });

recipes.forEach((p) =>
  Object.entries(p).forEach(([k, v]) => console.log(k, v))
);

// expected output:
// id /Recipe/9dd70857-5132-4874-93e2-df1b8dfa50a0
// name lemonaid
// ingredients [
//   {
//     id: '/Ingredient/059bc7a7-55f1-40dd-beb8-46772d301caf',
//     name: 'lemons',
//     dateAddedToPantry: '2023-01-15T00:24:01.665Z',
//     dateRemoved: null,
//     count: 0,
//     quantity: 40,
//     recipies: [ [Object] ]
//   },
//   {
//     id: '/Ingredient/0cee26b4-61bd-4f4e-ad79-7434d3858ee6',
//     name: 'water',
//     dateAddedToPantry: '2023-01-15T00:24:01.664Z',
//     dateRemoved: null,
//     count: 0,
//     quantity: 40,
//     recipies: [ [Object] ]
//   }
// ]
// author {
//   id: '/Author/30dd43ff-e67b-4611-a0c3-fbc5d9f494b4',
//   name: 'ALICE',
//   Recipes: [
//     {
//       id: '/Recipe/9dd70857-5132-4874-93e2-df1b8dfa50a0',
//       name: 'lemonaid',
//       ingredients: [Array],
//       author: '/Author/30dd43ff-e67b-4611-a0c3-fbc5d9f494b4',
//       instructions: null,
//       createdAt: '2023-01-15T00:24:01.668Z'
//     }
//   ],
//   selfPublisher: {
//     id: '/Publisher/ALICE PUBLISHER',
//     author: '/Author/30dd43ff-e67b-4611-a0c3-fbc5d9f494b4',
//     authors: []
//   },
//   publishers: []
// }
// instructions null
// createdAt 2023-01-15T00:24:01.668Z

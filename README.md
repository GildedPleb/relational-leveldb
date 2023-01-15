# Relational Level DB

This project is loosely based on the Prisma ORM paradigm, and represents the beginning of the rough work needed to implement a Level DB embedded backend with relational data. Given a `schema.prisma` file, which defines database relations, it maps those relations to the native LevelDB key/value store into what resembles a relational database.

Most of the work needed to get there is already completed in the linting of `schema.prisma` via the VS Code extension `prisma.prisma`. So, as long as your linting is golden, the rest should follow.

Keep in mind, a vast reduction in functionality is generated, mainly sticking to the basic CRUD operations, with sensible limits. It also does not include migration functionality, studio, or much of the heavy lifting that the real Prisma team has accomplished. But it is typed!

## Methodology

Each `key` in the Level DB Key/Value store follows the format: `/${Model.name}/${uuid()}`.
We then use the [IPFS Datastore-Level"](https://github.com/ipfs/js-datastore-level) as the implementation which gives us namespace-like key querying, allowing us to return all items of type via `findMany`. Each relation is stored as the `key` for the relational data in the `value.${relation}` of the source data, like so:

```js
console.log(await client.publishers.findMany());
// [
//  {
//    id: '/Publisher/ALICE PUBLISHER',
//    author: '/Author/1f53d5f5-f933-43a5-b439-355f48f86392',
//    ...
//  },
//  {
//	  id: '/Publisher/BOB PUBLISHER',
//    author: '/Author/109031f8-57ee-44fb-97f1-a8fb961f4295',
//    ...
//  },
// ]

console.log(await client.authors.findMany());
// [
//  {
//    id: '/Author/109031f8-57ee-44fb-97f1-a8fb961f4295',
//    name: 'BOB',
//    selfPublisher: '/Publisher/BOB PUBLISHER',
//    ...
//  },
//  {
//    id: '/Author/1f53d5f5-f933-43a5-b439-355f48f86392',
//    name: 'ALICE',
//    selfPublisher: '/Publisher/ALICE PUBLISHER',
//    ...
//  }
// ]

console.log(
  await client.findOne("/Author/1f53d5f5-f933-43a5-b439-355f48f86392")
);
// {
//	id: '/Author/1f53d5f5-f933-43a5-b439-355f48f86392',
//  name: 'ALICE',
//  selfPublisher: '/Publisher/ALICE PUBLISHER',
//  ...
// }
```

From here, we can recursively look up the relations by setting a `depth`:

```js
console.log(
  await client.findOne("/Author/1f53d5f5-f933-43a5-b439-355f48f86392", {
    depth: 1,
  })
);
// {
//  id: '/Author/1f53d5f5-f933-43a5-b439-355f48f86392',
//  name: 'ALICE',
//  selfPublisher: {
//    id: '/Publisher/ALICE PUBLISHER',
//    author: '/Author/1f53d5f5-f933-43a5-b439-355f48f86392',
//    ...
//  },
//  ...
```

For one-to-many or many-to-many relationships, instead of having a key string, we have a list of key strings.

With this basic guiding principle in mind, we can then scaffold out all CRUD operations via generators which adhere to this paradigm as it maps to the `prisma.schema`.

## Usage

1. `git clone`
1. `npm i`
1. define the schema
1. `npm run generate`
1. `npm run example`

Voilà! LevelDB is now relational!

(kinda).

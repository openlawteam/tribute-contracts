---
id: definition
title: Definition
---

The TributeDAO framework harnesses the power of **[The Graph](https://thegraph.com)** definition, which enables the Tribute UI to take advantage of the capabilities of a subgraph API.

The TributeDAO subgraph utilizes the **[GraphGL](https://graphql.org/)** API and **[AssemblyScript](https://www.assemblyscript.org/)** API to write subgraph mappings that is used for the Graph Protocol. Details on the workings of these APIs and The Graph Protocol are beyond the scope of what is covered in this documentation, check out the following links to further details on these APIs:

- **[The Graph Protocol](https://thegraph.com/docs/introduction#what-the-graph-is)**: explain everything you need to know in order to use The Graph Protocol.
- **[GraphQL API](https://thegraph.com/docs/graphql-api):** explains the GraphQL Query API that is used for the Graph Protocol
- **[AssemblyScript API](https://thegraph.com/docs/assemblyscript-api)**: documents what built-in APIs can be used when writing subgraph mappings.

The subgraph definition consists of the following files:

- `subgraph.yaml`: a YAML file containing the **[datasources and templates](https://thegraph.com/docs/define-a-subgraph#data-source-for-the-main-contract)** used for the subgraph manifest
- `schema.graphql`: a GraphQL schema containing the entities and fields of the data that is stored for the subgraph, and how to query it via GraphQL
- `AssemblyScript Mappings`: AssemblyScript code that translates from the event data in Ethereum to the entities defined in the schema.graphql (e.g. `subgraph/mappings/core/dao-registry-mapping.ts`)

More details on each of these files are provided in the subgraph structure category.

export const queryDaoByName = (name: string) => `
  {
      tributes(name: "${name}") {
        id
        name
      }
    }
    `;

export const queryProposalById = (id: string) => `
  {
      proposals(id: "${id}") {
        id
        proposalId
      }
    }
    `;

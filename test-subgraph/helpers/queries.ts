export const queryDaoByName = (name: string) => `
  {
      molochv3S(name: "${name}") {
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

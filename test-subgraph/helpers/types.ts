interface ProposalType {
  id: string;
  proposalId: string;
}

export interface SubgraphResponseType {
  proposals: ProposalType;
}

interface DaoType {
  id: string;
  name: string;
}

export interface SubgraphResponseDaoType {
  molochv3S: DaoType;
}

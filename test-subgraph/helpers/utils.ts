import { createApolloFetch } from "apollo-fetch";
import path from "path";
import { execSync } from "child_process";

// Types
interface SyncedSubgraphType {
  synced: boolean;
}

// Execute Child Processes
const srcDir = path.join(__dirname, "..");
export const exec = (cmd: string) => {
  try {
    return execSync(cmd, { cwd: srcDir, stdio: "inherit" });
  } catch (e) {
    throw new Error(`Failed to run command \`${cmd}\``);
  }
};

// Subgraph Support
export const fetchSubgraphs = createApolloFetch({
  uri: "http://localhost:8030/graphql",
});

export const fetchSubgraph = (subgraphUser: string, subgraphName: string) => {
  return createApolloFetch({
    uri: `http://localhost:8000/subgraphs/name/${subgraphUser}/${subgraphName}`,
  });
};

const checkIfAllSynced = (subgraphs: SyncedSubgraphType[]) => {
  console.log("subgraphs", subgraphs);
  const result = subgraphs.find(
    (el: SyncedSubgraphType) => el.synced === false
  );
  return Boolean(!result);
};

export const waitForSubgraphToBeSynced = async (delay: number) =>
  new Promise<{ synced: boolean }>((resolve, reject) => {
    // Wait for 5s
    // let deadline = Date.now() + 5 * 1000;
    let deadline = Date.now() + 60 * 1000;

    // Function to check if the subgraph is synced
    const checkSubgraphSynced = async () => {
      try {
        let result = await fetchSubgraphs({
          query: `{ indexingStatuses { synced } }`,
        });

        console.log(
          "================ result.data.indexingStatuses",
          result.data.indexingStatuses
        );
        if (checkIfAllSynced(result.data.indexingStatuses)) {
          resolve({ synced: true });
        } else {
          throw new Error("reject or retry");
        }
      } catch (e) {
        if (Date.now() > deadline) {
          console.log("The error: ", e);
          reject(new Error(`Timed out waiting for the subgraph to sync`));
        } else {
          setTimeout(checkSubgraphSynced, delay);
        }
      }
    };

    // Periodically check whether the subgraph has synced
    setTimeout(checkSubgraphSynced, delay);
  });

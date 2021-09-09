import React from "react";
import DiscordSVG from "../svg/DiscordSVG";
import GitHubSVG from "../svg/GitHubSVG";
import MediumSVG from "../svg/MediumSVG";

// @todo Add missing URLs when available
const SocialMediaLinks = {
  DISCORD: "https://discord.gg/tEfP68xnTd",
  // query params search sepcifically for openlawteam/tribute-ui and
  // openlawteam/tribute-contracts
  GITHUB:
    "https://github.com/search?q=org%3Aopenlawteam+tribute-ui+OR+tribute-contracts+in%3Aname&type=repositories",
  MEDIUM: "#",
};

export default function SocialMedia() {
  return (
    <div className="socialmedia">
      {/* <a
        href={SocialMediaLinks.MEDIUM}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MediumSVG />
      </a> */}
      <a
        href={SocialMediaLinks.DISCORD}
        target="_blank"
        rel="noopener noreferrer"
      >
        <DiscordSVG />
      </a>
      <a
        href={SocialMediaLinks.GITHUB}
        target="_blank"
        rel="noopener noreferrer"
      >
        <GitHubSVG />
      </a>
    </div>
  );
}

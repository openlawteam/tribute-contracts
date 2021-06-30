pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IFinancing.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "./interfaces/chainlink/AggregatorV3Interface.sol";

/**
MIT License

Copyright (c) 2020 Openlaw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

contract FinancingChainlinkContract is
    IFinancing,
    DaoConstants,
    MemberGuard,
    AdapterGuard
{
    bytes32 internal constant _PRICE_FEED_ADDRESS_CONFIG =
        keccak256("finance-chainlink:price-feed:address");

    //decimals from Chainlink priceFeed.decimals();

    /**
     * 	@notice choose a priceFeed contract, see https://docs.chain.link/docs/ethereum-addresses
     * Aggregator: ETH/USD - 8 decimals
     *	contract address of the price feed from Chainlink
     * Rinkeby Contract Address: 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
     * Mainnet Contract Address:  0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
     * Mainnet Contract USDC/ETH - 18 decimals: 0x986b5E1e1755e3C2440e960477f25201B0a8bbD4
     */

    // constructor(address feedAddress) {
    //     _priceFeed = AggregatorV3Interface(feedAddress);
    // }
    struct ProposalDetails {
        address applicant; // the proposal applicant address, can not be a reserved address
        uint256 amount; // the amount requested for funding
        address token; // the token address in which the funding must be sent to
    }

    // keeps track of all financing proposals handled by each dao
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable {
        revert("fallback revert");
    }

    function configureDao(DaoRegistry dao, address priceFeedAddr)
        external
        onlyAdapter(dao)
    {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddr);
        uint8 decimalsChainlink = priceFeed.decimals();
        require(
            decimalsChainlink != 8 && decimalsChainlink != 18,
            "chainlink pricefeed is not compatible, must be 8 or 18 decimals"
        );
        dao.setAddressConfiguration(_PRICE_FEED_ADDRESS_CONFIG, priceFeedAddr);
    }

    /**
     * @notice Creates and sponsors a financing proposal.
     * @dev Applicant address must not be reserved.
     * @dev Token address must be allowed/supported by the DAO Bank.
     * @dev Requested amount must be greater than zero.
     * @dev Only members of the DAO can sponsor a financing proposal.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     * @param applicant The applicant address.
     * @param token The token to receive the funds.
     * @param amount The desired amount.
     * @param data Additional details about the financing proposal.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address token,
        uint256 amount,
        bytes memory data
    ) external override reentrancyGuard(dao) {
        require(amount > 0, "invalid requested amount");
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(bank.isTokenAllowed(token), "token not allowed");
        require(
            isNotReservedAddress(applicant),
            "applicant using reserved address"
        );

        dao.submitProposal(proposalId);

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        proposal.applicant = applicant;
        proposal.amount = amount;
        proposal.token = token;

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        address sponsoredBy =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );

        dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    /**
     * @notice Processing a financing proposal to grant the requested funds.
     * @dev Only proposals that were not processed are accepted.
     * @dev Only proposals that were sponsored are accepted.
     * @dev Only proposals that passed can get processed and have the funds released.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reentrancyGuard(dao)
    {
        ProposalDetails memory details = proposals[address(dao)][proposalId];

        IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
        require(address(votingContract) != address(0), "adapter not found");

        require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal needs to pass"
        );

        address priceFeedAddr =
            dao.getAddressConfiguration(_PRICE_FEED_ADDRESS_CONFIG);

        dao.processProposal(proposalId);
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        //Chainlink feed instance
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddr);
        //check decimals to see if 8 or 18
        uint8 decimalsChainlink = priceFeed.decimals();
        uint256 amount = details.amount;
        address token = details.token;
        address applicant = details.applicant;
        if (decimalsChainlink == 8) {
            //enter US Dollar = details.amount and convert with _convertToWeiValue
            uint256 convertedAmount = _convertToWeiValue(amount, priceFeed);
            bank.subtractFromBalance(GUILD, token, convertedAmount);
            bank.addToBalance(applicant, token, convertedAmount);
        } else {
            bank.subtractFromBalance(GUILD, token, amount);
            bank.addToBalance(applicant, token, amount);
        }
    }

    /* 
        @param _amount = the amount in US Dollars to convert to ETH
        multipliers are needed in numerator (usd to wei) and denominator 
        (convert result from chainlink to wei) 
     */
    function _convertToWeiValue(uint256 amount, AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        //convert int to uint
        uint256 denominator = uint256(answer);
        //multipliers to ensure values calculated in wei
        uint256 ethInUsdAmount =
            ((amount * 1000000000000000000000) / denominator) * 100000;
        return ethInUsdAmount;
    }
}

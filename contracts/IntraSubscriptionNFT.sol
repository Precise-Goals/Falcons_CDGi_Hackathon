// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title IntraSubscriptionNFT
 * @notice Soulbound ERC-721 subscription token on MST Blockchain Testnet (Chain ID 91562037).
 * Implements transparent 2, 3, 5 MSTC pricing for Free (15), Starter (30), and Business (45) quota pools.
 */
contract IntraSubscriptionNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;

    struct SubscriptionInfo {
        string plan;
        uint256 nftQuota;
        uint256 mintedAt;
        uint256 pricePaid;
    }

    mapping(uint256 => SubscriptionInfo) public subscriptions;
    mapping(address => uint256) public userActiveTokenId;
    mapping(address => bool) public hasActiveSubscription;

    event SubscriptionMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        string plan,
        uint256 nftQuota,
        uint256 pricePaid
    );

    constructor(address initialOwner) 
        ERC721("Intra Resilience Subscription", "INTRASUB") 
        Ownable(initialOwner) 
    {
        _nextTokenId = 1;
    }

    /**
     * @notice Returns required price in Wei for a plan
     * Free: 2 MSTC
     * Starter: 3 MSTC
     * Business: 5 MSTC
     */
    function getPlanPrice(string memory plan) public pure returns (uint256 priceWei, uint256 quota) {
        bytes32 planHash = keccak256(bytes(plan));
        if (planHash == keccak256(bytes("free"))) {
            return (2 ether, 15);
        } else if (planHash == keccak256(bytes("starter"))) {
            return (3 ether, 30);
        } else if (planHash == keccak256(bytes("business"))) {
            return (5 ether, 45);
        } else {
            revert("Invalid plan identifier. Use 'free', 'starter', or 'business'");
        }
    }

    /**
     * @notice Mint or upgrade subscription NFT for caller or specified recipient
     */
    function mintSubscription(address recipient, string calldata plan) external payable returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        (uint256 requiredPrice, uint256 quota) = getPlanPrice(plan);

        // Require payment unless operator/owner sponsors the transaction
        if (msg.sender != owner()) {
            require(msg.value >= requiredPrice, "Insufficient MSTC sent for requested plan tier");
        }

        uint256 tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);

        subscriptions[tokenId] = SubscriptionInfo({
            plan: plan,
            nftQuota: quota,
            mintedAt: block.timestamp,
            pricePaid: msg.value
        });

        userActiveTokenId[recipient] = tokenId;
        hasActiveSubscription[recipient] = true;

        emit SubscriptionMinted(recipient, tokenId, plan, quota, msg.value);
        return tokenId;
    }

    /**
     * @notice Soulbound pattern: tokens are bound to recipient address and cannot be transferred
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: transfer not allowed");
        }
        return super._update(to, tokenId, auth);
    }

    function _buildSvg(uint256 tokenId, string memory plan, uint256 quota) internal pure returns (string memory) {
        bytes memory part1 = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">',
            '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#800020"/><stop offset="100%" stop-color="#0a0a0a"/></linearGradient></defs>',
            '<rect width="500" height="500" rx="32" fill="url(#g)"/>',
            '<rect x="20" y="20" width="460" height="460" rx="24" fill="none" stroke="#ff4d6d" stroke-width="2" stroke-opacity="0.3"/>',
            '<text x="50" y="80" fill="#ffffff" font-family="monospace" font-size="20" font-weight="bold">INTRA PROTOCOL</text>'
        );
        bytes memory part2 = abi.encodePacked(
            '<text x="50" y="110" fill="#ff4d6d" font-family="monospace" font-size="12">MST BLOCKCHAIN TESTNET (91562037)</text>',
            '<text x="50" y="220" fill="#ffffff" font-family="sans-serif" font-size="36" font-weight="900">', plan, '</text>',
            '<text x="50" y="260" fill="#ffffff" font-family="monospace" font-size="18">QUOTA: ', quota.toString(), ' NFTS</text>',
            '<text x="50" y="320" fill="#888888" font-family="monospace" font-size="14">TOKEN ID #', tokenId.toString(), '</text>',
            '<text x="50" y="420" fill="#ff4d6d" font-family="monospace" font-size="12">SOULBOUND &bull; NON-TRANSFERABLE</text></svg>'
        );
        return string(abi.encodePacked(part1, part2));
    }

    /**
     * @notice Returns fully on-chain metadata URI (SVG artwork + JSON attributes)
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        SubscriptionInfo memory sub = subscriptions[tokenId];

        string memory svg = _buildSvg(tokenId, sub.plan, sub.nftQuota);

        string memory json = string(
            abi.encodePacked(
                '{"name": "Intra Subscription #', tokenId.toString(), ' (', sub.plan, ')",',
                '"description": "Soulbound subscription access token for Intra API Observability.",',
                '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
                '"attributes": [',
                '{"trait_type": "Tier", "value": "', sub.plan, '"},',
                '{"trait_type": "NFT Quota", "value": ', sub.nftQuota.toString(), '}',
                ']}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    /**
     * @notice Owner withdraw for collected subscription MSTC fees
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
    }
}

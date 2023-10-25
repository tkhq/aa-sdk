import type { ICardItem } from "@models";
import { NftTokenType } from "alchemy-sdk";
import { parseEther } from "viem";

export default [
  {
    title: "Account Kit NFT",
    description:
      "You minted this NFT with an ERC-4337 smart account powered by Account Kit.",
    contract: {
      tokenType: NftTokenType.ERC721,
      address: "0x90A6f46B126ea8b8192A620a7Eb6FeB4112b85c9",
    },
    metadata:
      "https://static.alchemyapi.io/assets/accountkit/demo_metadata.json",
    media: [
      {
        raw: "https://static.alchemyapi.io/assets/accountkit/accountkit.jpg",
      },
    ],
    price: parseEther("0.00"),
  },
] as ICardItem[];

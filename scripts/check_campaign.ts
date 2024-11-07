import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Crowdfunding } from "../target/types/crowdfunding";

async function main() {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;

	const campaignAddress = new anchor.web3.PublicKey("2jC5JWEDSZbUp6VQoXcfhVsv9h1TZcT6eU9kftMVQHMY");

	const campaign = await program.account.campaign.fetch(campaignAddress);

	console.log("Campaign Goal:", campaign.goal.toString(), "lamports");
	console.log("Amount Raised:", campaign.raisedAmount.toString(), "lamports");
	console.log("Campaign Deadline:", new Date(Number(campaign.deadline) * 1000).toLocaleString());
	console.log("Campaign Creator:", campaign.creator.toBase58());
}

main().catch((err) => {
	console.error("Error fetching campaign data:", err);
});

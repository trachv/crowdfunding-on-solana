import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Crowdfunding } from "../target/types/crowdfunding";

async function fetchAllCampaigns() {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;

	const campaigns = await program.account.campaign.all();

	campaigns.forEach((campaign) => {
		console.log("Campaign PubKey:", campaign.publicKey.toBase58());
		console.log("Campaign Data:", campaign.account);
	});
}

fetchAllCampaigns().catch((err) => {
	console.error("Error fetching campaigns:", err);
});

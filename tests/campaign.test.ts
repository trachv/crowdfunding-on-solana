import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Crowdfunding } from "../target/types/crowdfunding";
import { expect } from "chai";

describe("crowdfunding", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Crowdfunding as anchor.Program;

	let adminPDA: anchor.web3.PublicKey;

	before(async () => {
		[adminPDA] = await anchor.web3.PublicKey.findProgramAddress(
			[Buffer.from("admin")],
			program.programId
		);

		await program.methods
			.initialize()
			.accounts({
				admin: adminPDA,
				authority: provider.wallet.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.rpc();
	});

	it("Create campaign", async () => {
		const campaign = anchor.web3.Keypair.generate();

		const title = "Test Campaign";
		const description = "This is a test campaign.";
		const goal = new anchor.BN(1000000000); // 1 SOL
		const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

		await program.methods
			.createCampaign(title, description, goal, deadline)
			.accounts({
				campaign: campaign.publicKey,
				creator: provider.wallet.publicKey,
				admin: adminPDA,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.signers([campaign])
			.rpc();

		const account = await (program as unknown as Program<Crowdfunding>).account.campaign.fetch(campaign.publicKey);
		expect(account.creator.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
		expect(account.title).to.equal(title);
		expect(account.description).to.equal(description);
		expect(account.goal.toNumber()).to.equal(goal.toNumber());
		expect(account.raisedAmount.toNumber()).to.equal(0);
	});
});

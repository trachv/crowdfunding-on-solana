import * as anchor from "@coral-xyz/anchor";

async function main() {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Crowdfunding as anchor.Program;

	const [adminPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
		[Buffer.from("admin")],
		program.programId
	);

	const campaignKeypair = anchor.web3.Keypair.generate();

	const title = "Test Campaign";
	const description = "This is a test campaign.";
	const goal = new anchor.BN(1000000000); // 1 SOL (1 SOL = 1_000_000_000 lamports)
	const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

	await program.methods
		.createCampaign(title, description, goal, deadline)
		.accounts({
			campaign: campaignKeypair.publicKey,
			creator: provider.wallet.publicKey,
			admin: adminPDA,
			systemProgram: anchor.web3.SystemProgram.programId,
		})
		.signers([campaignKeypair])
		.rpc();

	console.log("Campaign created:", campaignKeypair.publicKey.toString());
}

main().catch((err) => {
	console.error(err);
});

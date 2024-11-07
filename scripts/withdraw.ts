import * as anchor from "@coral-xyz/anchor";

async function main() {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Crowdfunding as anchor.Program;

	const campaignAddress = new anchor.web3.PublicKey("2jC5JWEDSZbUp6VQoXcfhVsv9h1TZcT6eU9kftMVQHMY");

	const [adminPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
		[Buffer.from("admin")],
		program.programId
	);

	await program.methods
		.withdraw()
		.accounts({
			campaign: campaignAddress,
			creator: provider.wallet.publicKey,
			admin: adminPDA,
		})
		.rpc();

	console.log(`Successfully withdrawn funds from campaign ${campaignAddress.toBase58()}`);
}

main().catch((err) => {
	console.error("Error withdrawing funds:", err);
});

import * as anchor from "@coral-xyz/anchor";

async function main() {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Crowdfunding as anchor.Program;

	const [adminPDA, _] = await anchor.web3.PublicKey.findProgramAddressSync(
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

	console.log("Admin account initialized.");
}

main().catch((err) => {
	console.error(err);
});

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Crowdfunding } from "../target/types/crowdfunding";

async function main() {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Crowdfunding as anchor.Program;

	const [adminPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
		[Buffer.from("admin")],
		program.programId
	);

	await program.methods
		.togglePause()
		.accounts({
			admin: adminPDA,
			authority: provider.wallet.publicKey,
		})
		.rpc();

	console.log("Contract paused state has been toggled.");
}

main().catch((err) => {
	console.error("Error toggling contract pause state:", err);
});

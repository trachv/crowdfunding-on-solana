import * as anchor from "@coral-xyz/anchor";
import { BN } from "bn.js";

async function main() {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Crowdfunding as anchor.Program;

	const campaignAddress = new anchor.web3.PublicKey("2jC5JWEDSZbUp6VQoXcfhVsv9h1TZcT6eU9kftMVQHMY");

	const [adminPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
		[Buffer.from("admin")],
		program.programId
	);

	const amount = new BN(100000000); // 0.1 SOL = 100_000_000 lamports

	await program.methods
		.donate(amount)
		.accounts({
			campaign: campaignAddress,
			donor: provider.wallet.publicKey,
			admin: adminPDA,
			systemProgram: anchor.web3.SystemProgram.programId,
		})
		.rpc();

	console.log(`Donated ${amount.toNumber()} lamports to campaign ${campaignAddress.toBase58()}`);
}

main().catch((err) => {
	console.error(err);
});

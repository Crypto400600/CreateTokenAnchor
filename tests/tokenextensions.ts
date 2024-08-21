import * as anchor from "@coral-xyz/anchor";
import { Program, Provider } from "@coral-xyz/anchor";
import { Tokenextensions } from "../target/types/tokenextensions";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";
import { PublicKey, SystemProgram } from '@solana/web3.js'
//import {  } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import idl from "../target/idl/tokenextensions.json"
import { assert } from "chai";

describe("tokenextensions", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.Tokenextensions as Program<Tokenextensions>;

  const findSplTokenMintAddress = async () => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("spl-token-mint")],
      new PublicKey(idl.metadata.address)
    );
  }
  const findVaultAddress = async () => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      new PublicKey(idl.metadata.address)
    );
  }
  const addSols = async (
    provider: Provider,
    wallet: anchor.web3.PublicKey,
    amount = 1 * anchor.web3.LAMPORTS_PER_SOL
  ) => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(wallet, amount),
      "confirmed"
    );
  };

  const payer = anchor.web3.Keypair.generate();

  before("Add sols to wallet ", async () => {
    await addSols(provider, payer.publicKey, 2); // add some sols before calling test cases
  });

  it("Spl token is initialized!", async () => {
    const [splTokenMint, _1] = await findSplTokenMintAddress();
    console.log("spltoeknmint", splTokenMint);
    const [vaultMint, _2] = await findVaultAddress();
    console.log("vault", vaultMint);
    const tx = await program.methods
      .createMint()
      .accounts({
        splTokenMint: splTokenMint,
        vault: vaultMint,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    const vaultData = await program.account.vault.fetch(vaultMint);

    assert(
      vaultData.splTokenMint.toString() === splTokenMint.toString(),
      "The spl token mint should be same"
    );

    console.log("Your transaction signature", tx);
  });

});

